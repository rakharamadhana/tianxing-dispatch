<script setup>
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'
import MonthPickerModal from './MonthPickerModal.vue'
import { useDrivers } from '../composables/useDrivers.js'
import {
  downloadMonthlyMaintenanceReport,
  downloadYearlyMaintenanceReport
} from '../utils/maintenanceReport.js'

const props = defineProps({
  maintenance: { type: Object, required: true } // the useMaintenance() instance
})
const emit = defineEmits(['back'])

const { drivers, load: loadDrivers } = useDrivers(props.maintenance.branch.value)
watch(() => props.maintenance.branch.value, loadDrivers)

const availableYears = computed(() => {
  const years = new Set(
    props.maintenance.rows.value
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
    await downloadMonthlyMaintenanceReport({
      records: props.maintenance.rows.value,
      branch: props.maintenance.branch.value,
      year,
      month,
      filename: `${props.maintenance.branch.value}-${year}-${month}-保養總表.xlsx`
    })
    showMonthPicker.value = false
  } catch (e) {
    console.error('Maintenance summary export failed', e)
    exportError.value = 'error'
  } finally {
    exporting.value = false
  }
}

async function confirmFullSummaryDownload({ year }) {
  exportError.value = ''
  exporting.value = true
  try {
    await downloadYearlyMaintenanceReport({
      records: props.maintenance.rows.value,
      branch: props.maintenance.branch.value,
      year,
      filename: `${props.maintenance.branch.value}-${year}-全總表.xlsx`
    })
    showYearPicker.value = false
  } catch (e) {
    console.error('Maintenance full summary export failed', e)
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
  props.maintenance.commitEdit()
}

function setStatus(row, status) {
  props.maintenance.commitAction(() => { row.status = status })
}

function formatDate(value) {
  return value ? String(value).slice(0, 16).replace('T', ' ') : ''
}
</script>

<template>
  <div class="content">
    <div class="profile-header">
      <button class="btn back-btn" @click="emit('back')">
        <Icon name="chevron-left" :size="16" />
        <span>{{ $t('maintenance.back') }}</span>
      </button>
      <h1 class="profile-title">{{ $t('maintenance.title') }}</h1>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <button class="btn" @click="maintenance.addRow()">
        <Icon name="add" :size="16" /><span>{{ $t('actions.addRow') }}</span>
      </button>

      <span v-if="maintenance.saving.value || maintenance.dirty.value" class="dirty-flag">
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

    <div class="card maintenance-grid">
      <div class="grid-head">
        <div class="h">{{ $t('maintenance.columns.dateTime') }}</div>
        <div class="h">{{ $t('maintenance.columns.driverName') }}</div>
        <div class="h">{{ $t('maintenance.columns.address') }}</div>
        <div class="h">{{ $t('maintenance.columns.amount') }}</div>
        <div class="h">{{ $t('maintenance.columns.note') }}</div>
        <div class="h">{{ $t('maintenance.columns.receipt') }}</div>
        <div class="h">{{ $t('maintenance.columns.status') }}</div>
        <div class="h"></div>
      </div>

      <div v-if="maintenance.rows.value.length === 0" class="empty-state">
        {{ $t('status.empty') }}
      </div>

      <div v-for="(row, i) in maintenance.rows.value" :key="row._key" class="job-row">
        <div class="cell cell-muted">{{ formatDate(row.created_at) || '—' }}</div>

        <div class="cell">
          <span v-if="row.id">{{ row.driver_name }}</span>
          <select v-else :value="row.driver_id" @change="onDriverPicked(row, $event.target.value)">
            <option value="" disabled>{{ $t('maintenance.fields.selectDriver') }}</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>

        <div class="cell">
          <input
            v-model="row.address"
            :placeholder="$t('maintenance.fields.address')"
            @change="maintenance.commitEdit()"
          />
        </div>

        <div class="cell cell-amount">
          <input
            v-model.number="row.amount"
            type="number"
            min="0"
            @change="maintenance.commitEdit()"
          />
        </div>

        <div class="cell">
          <input
            v-model="row.note"
            :placeholder="$t('maintenance.fields.note')"
            @change="maintenance.commitEdit()"
          />
        </div>

        <div class="cell">
          <a
            v-if="row.receipt_url"
            class="receipt-link"
            :href="row.receipt_url"
            target="_blank"
            rel="noopener"
          >
            <Icon name="summary" :size="14" /><span>{{ $t('maintenance.receiptLink') }}</span>
          </a>
          <span v-else class="cell-muted">{{ $t('maintenance.noReceipt') }}</span>
        </div>

        <div class="cell status-cell">
          <span class="chip static" :class="row.status">{{ $t('requestStatus.' + row.status) }}</span>
          <div class="status-actions">
            <button
              class="btn tiny success"
              :disabled="row.status === 'approved'"
              @click="setStatus(row, 'approved')"
            >{{ $t('actions.approve') }}</button>
            <button
              class="btn tiny reject"
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
            @click="maintenance.removeRow(i)"
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
.maintenance-grid .grid-head,
.maintenance-grid .job-row {
  grid-template-columns: 120px 130px 1fr 90px 1fr 128px 180px 40px;
}
.maintenance-grid .cell-amount input {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.status-cell {
  gap: 4px;
  align-items: flex-start;
}
.status-actions {
  display: flex;
  gap: 4px;
}
.btn.tiny {
  padding: 4px 8px;
  font-size: 11px;
  min-height: 0;
}
.btn.success {
  border-color: var(--status-complete-fg);
  background: var(--status-complete-fg);
  color: #fff;
}
.btn.success:hover:not(:disabled) {
  filter: brightness(0.93);
  background: var(--status-complete-fg);
}
.btn.reject {
  border-color: var(--brand-red);
  color: var(--brand-red);
}
.btn.reject:hover:not(:disabled) {
  background: #fdecea;
}
.receipt-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 800;
  color: var(--brand-blue);
  background: rgba(22, 174, 184, 0.1);
  border-radius: 20px;
  padding: 6px 10px;
  text-decoration: none;
}
.receipt-link:hover {
  background: rgba(22, 174, 184, 0.18);
}

@media (max-width: 980px) {
  .maintenance-grid .job-row {
    grid-template-columns: 1fr;
    padding: var(--s2) var(--cell-px);
    row-gap: 10px;
  }
  .maintenance-grid .status-cell {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .maintenance-grid .cell-actions {
    align-items: flex-end;
  }
}
</style>
