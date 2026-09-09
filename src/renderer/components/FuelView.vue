<script setup>
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'
import MonthPickerModal from './MonthPickerModal.vue'
import { useDrivers } from '../composables/useDrivers.js'
import { downloadMonthlyFuelReport, downloadYearlyFuelReport } from '../utils/fuelReport.js'

const props = defineProps({
  fuel: { type: Object, required: true } // the useFuel() instance
})
const emit = defineEmits(['back'])

const { drivers, load: loadDrivers } = useDrivers(props.fuel.branch.value)
watch(() => props.fuel.branch.value, loadDrivers)

const availableYears = computed(() => {
  const years = new Set(
    props.fuel.rows.value
      .map((r) => Number(String(r.created_at || '').slice(0, 4)))
      .filter((y) => Number.isInteger(y) && y > 2000)
  )
  if (!years.size) years.add(new Date().getFullYear())
  return [...years].sort((a, b) => b - a)
})

const showMonthPicker = ref(false)
const showYearPicker = ref(false)
const exporting = ref(false)
const exportError = ref('')

function openSummaryPicker() {
  exportError.value = ''
  showMonthPicker.value = true
}

function openFullSummaryPicker() {
  exportError.value = ''
  showYearPicker.value = true
}

async function confirmSummaryDownload({ year, month }) {
  exportError.value = ''
  exporting.value = true
  try {
    await downloadMonthlyFuelReport({
      records: props.fuel.rows.value,
      branch: props.fuel.branch.value,
      year,
      month,
      filename: `${props.fuel.branch.value}-${year}-${month}-油資總表.xlsx`
    })
    showMonthPicker.value = false
  } catch (e) {
    console.error('Fuel summary export failed', e)
    exportError.value = 'error'
  } finally {
    exporting.value = false
  }
}

async function confirmFullSummaryDownload({ year }) {
  exportError.value = ''
  exporting.value = true
  try {
    await downloadYearlyFuelReport({
      records: props.fuel.rows.value,
      branch: props.fuel.branch.value,
      year,
      filename: `${props.fuel.branch.value}-${year}-全總表.xlsx`
    })
    showYearPicker.value = false
  } catch (e) {
    console.error('Fuel full summary export failed', e)
    exportError.value = 'error'
  } finally {
    exporting.value = false
  }
}

function onDriverPicked(row, driverId) {
  const driver = drivers.value.find((d) => d.id === driverId)
  row.driver_id = driverId
  row.driver_name = driver ? driver.name : ''
  // From the All tab there's no single active branch to save the new
  // request under, so use the picked driver's own branch instead.
  if (driver) row.branch = driver.branch
  props.fuel.commitEdit()
}

function setStatus(row, status) {
  props.fuel.commitAction(() => { row.status = status })
}

function formatDate(value) {
  return value ? String(value).slice(0, 16).replace('T', ' ') : ''
}
</script>

<template>
  <div class="content">
    <div class="profile-header">
      <button class="btn ghost back-btn" @click="emit('back')">
        <Icon name="chevron-left" :size="16" />
        <span>{{ $t('fuel.back') }}</span>
      </button>
      <h1 class="profile-title">{{ $t('fuel.title') }}</h1>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <button class="btn" @click="fuel.addRow()">
        <Icon name="add" :size="16" /><span>{{ $t('actions.addRow') }}</span>
      </button>

      <span v-if="fuel.saving.value || fuel.dirty.value" class="dirty-flag">
        <span class="dot"></span>{{ $t('status.saving') }}
      </span>
      <span v-else class="saved-flag">
        {{ $t('status.saved') }}
      </span>

      <span class="grow"></span>

      <button class="btn" :disabled="exporting" @click="openSummaryPicker">
        <Icon name="summary" :size="16" /><span>{{ $t('actions.summary') }}</span>
      </button>
      <button class="btn" :disabled="exporting" @click="openFullSummaryPicker">
        <Icon name="summary" :size="16" /><span>{{ $t('actions.fullSummary') }}</span>
      </button>
      <span v-if="exportError" class="error-flag">
        <span class="dot"></span>{{ $t('export.' + exportError) }}
      </span>
    </div>

    <div class="card maintenance-grid fuel-grid">
      <div class="grid-head">
        <div class="h">{{ $t('fuel.columns.dateTime') }}</div>
        <div class="h">{{ $t('fuel.columns.driverName') }}</div>
        <div class="h">{{ $t('fuel.columns.reportedAmount') }}</div>
        <div class="h">{{ $t('fuel.columns.approvedAmount') }}</div>
        <div class="h">{{ $t('fuel.columns.status') }}</div>
        <div class="h"></div>
      </div>

      <div v-if="fuel.rows.value.length === 0" class="empty-state">
        {{ $t('status.empty') }}
      </div>

      <div v-for="(row, i) in fuel.rows.value" :key="row._key" class="job-row">
        <div class="cell cell-muted">{{ formatDate(row.created_at) || '—' }}</div>

        <div class="cell">
          <span v-if="row.id">{{ row.driver_name }}</span>
          <select v-else :value="row.driver_id" @change="onDriverPicked(row, $event.target.value)">
            <option value="" disabled>{{ $t('fuel.fields.selectDriver') }}</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>

        <div class="cell cell-amount">
          <input
            v-model.number="row.reported_amount"
            type="number"
            min="0"
            @change="fuel.commitEdit()"
          />
        </div>

        <div class="cell cell-amount">
          <input
            v-model.number="row.approved_amount"
            type="number"
            min="0"
            @change="fuel.commitEdit()"
          />
        </div>

        <div class="cell status-cell">
          <span class="chip static" :class="row.status">{{ $t('requestStatus.' + row.status) }}</span>
          <div class="status-actions">
            <button
              class="btn ghost tiny"
              :disabled="row.status === 'approved'"
              @click="setStatus(row, 'approved')"
            >{{ $t('actions.approve') }}</button>
            <button
              class="btn ghost tiny"
              :disabled="row.status === 'rejected'"
              @click="setStatus(row, 'rejected')"
            >{{ $t('actions.reject') }}</button>
          </div>
        </div>

        <div class="cell cell-actions">
          <button
            v-if="!row.id"
            class="row-del"
            :title="$t('actions.delete')"
            @click="fuel.removeRow(i)"
          >
            <Icon name="trash" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <MonthPickerModal
      v-if="showMonthPicker"
      :years="availableYears"
      @confirm="confirmSummaryDownload"
      @cancel="showMonthPicker = false"
    />
    <MonthPickerModal
      v-if="showYearPicker"
      :years="availableYears"
      :show-month="false"
      @confirm="confirmFullSummaryDownload"
      @cancel="showYearPicker = false"
    />
  </div>
</template>

<style scoped>
.fuel-grid .grid-head,
.fuel-grid .job-row {
  grid-template-columns: 130px 160px 150px 150px 170px 40px;
}
.fuel-grid .cell-amount input {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.status-cell {
  gap: 4px;
}
.status-actions {
  display: flex;
  gap: 4px;
}
.btn.ghost.tiny {
  padding: 4px 8px;
  font-size: 11px;
}

@media (max-width: 980px) {
  .fuel-grid .job-row {
    grid-template-columns: 1fr;
    padding: var(--s2) var(--cell-px);
    row-gap: 10px;
  }
  .fuel-grid .status-cell {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .fuel-grid .cell-actions {
    align-items: flex-end;
  }
}
</style>
