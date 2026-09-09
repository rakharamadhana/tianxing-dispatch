<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import JobRow from './JobRow.vue'
import FilterBar from './FilterBar.vue'
import Icon from './Icon.vue'
import MonthPickerModal from './MonthPickerModal.vue'
import { useWorkers } from '../composables/useWorkers.js'
import { downloadMonthlyJobsReport, downloadYearlyJobsReport } from '../utils/jobsReport.js'

const props = defineProps({
  jobs: { type: Object, required: true } // the useJobs() instance
})
const emit = defineEmits(['payroll'])

// Worker roster for the active branch — shared by every row's "assign
// workers" modal and by the income-statement export's payroll split.
const { workers, load: loadWorkers } = useWorkers(props.jobs.branch.value)
watch(() => props.jobs.branch.value, loadWorkers)

// Summary / Full Summary export: always reads the full year fresh from the
// backend (ignoring any active search filters), so exports are never
// silently narrowed by whatever's currently typed into the filter bar.
const showMonthPicker = ref(false)
const exporting = ref(false)
const exportError = ref('')

async function loadYearRows() {
  return window.api.jobs.list(props.jobs.branch.value, { year: props.jobs.filters.value.year })
}

/** Fuel/maintenance requests aren't year-scoped server-side, so filter by created_at here. */
async function loadYearCostRecords(year) {
  const [fuelRows, maintenanceRows] = await Promise.all([
    window.api.fuel.list(props.jobs.branch.value),
    window.api.maintenance.list(props.jobs.branch.value)
  ])
  const inYear = (r) => String(r.created_at || '').startsWith(String(year))
  return { fuelRecords: fuelRows.filter(inYear), maintenanceRecords: maintenanceRows.filter(inYear) }
}

async function exportFullSummary() {
  exportError.value = ''
  exporting.value = true
  try {
    const year = props.jobs.filters.value.year
    const rows = await loadYearRows()
    if (!rows.length) {
      exportError.value = 'empty'
      return
    }
    const { fuelRecords, maintenanceRecords } = await loadYearCostRecords(year)
    await downloadYearlyJobsReport({
      jobs: rows,
      workerRoster: Object.fromEntries(workers.value.map((w) => [w.id, w])),
      fuelRecords,
      maintenanceRecords,
      year,
      filename: `${props.jobs.branch.value}-${year}-全總表.xlsx`
    })
  } catch (e) {
    console.error('Full summary export failed', e)
    exportError.value = 'error'
  } finally {
    exporting.value = false
  }
}

function openSummaryPicker() {
  exportError.value = ''
  showMonthPicker.value = true
}

async function confirmSummaryDownload({ year, month }) {
  exportError.value = ''
  exporting.value = true
  try {
    const rows = await loadYearRows()
    const monthRows = rows.filter((r) => Number(String(r.job_date).slice(4, 6)) === Number(month))
    if (!monthRows.length) {
      exportError.value = 'empty'
      return
    }
    await downloadMonthlyJobsReport({
      jobs: rows,
      workerRoster: Object.fromEntries(workers.value.map((w) => [w.id, w])),
      year,
      month,
      filename: `${props.jobs.branch.value}-${year}-${month}-總表.xlsx`
    })
    showMonthPicker.value = false
  } catch (e) {
    console.error('Summary export failed', e)
    exportError.value = 'error'
  } finally {
    exporting.value = false
  }
}

// Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z to redo — app-level, overrides native input undo.
function onKeydown(e) {
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
  e.preventDefault()
  if (e.shiftKey) {
    props.jobs.redo()
  } else {
    props.jobs.undo()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const PAGE_SIZE = 10
const page = ref(1)

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.jobs.rows.value.length / PAGE_SIZE))
)

const pagedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return props.jobs.rows.value.slice(start, start + PAGE_SIZE)
})

// Keep the page in range when the row count changes.
watch(pageCount, (n) => {
  if (page.value > n) page.value = n
})

function absoluteIndex(localIndex) {
  return (page.value - 1) * PAGE_SIZE + localIndex
}

function prevPage() {
  if (page.value > 1) page.value--
}
function nextPage() {
  if (page.value < pageCount.value) page.value++
}

function addRow() {
  props.jobs.addRow()
  page.value = pageCount.value // jump to the page holding the new row
}
</script>

<template>
  <!-- Toolbar: page nav (left) + actions (right) -->
  <div class="toolbar">
    <div class="pager">
      <button class="btn icon-only" @click="prevPage" :disabled="page <= 1" :title="$t('actions.prevPage')">
        <Icon name="chevron-left" :size="16" />
      </button>
      <span class="page-indicator">{{ page }} / {{ pageCount }}</span>
      <button class="btn icon-only" @click="nextPage" :disabled="page >= pageCount" :title="$t('actions.nextPage')">
        <Icon name="chevron-right" :size="16" />
      </button>
    </div>

    <button class="btn" @click="addRow">
      <Icon name="add" :size="16" /><span>{{ $t('actions.addRow') }}</span>
    </button>

    <span v-if="jobs.saving.value || jobs.dirty.value" class="dirty-flag">
      <span class="dot"></span>{{ $t('status.saving') }}
    </span>
    <span v-else-if="!jobs.saveError.value" class="saved-flag">
      {{ $t('status.saved') }}
    </span>
    <span v-if="jobs.saveError.value" class="error-flag">
      <span class="dot"></span>{{ $t('validation.' + jobs.saveError.value) }}
    </span>

    <span class="grow"></span>

    <!-- Summary (month) / Full Summary (year) exports. Payroll: placeholder for a later phase (needs named-worker data). -->
    <button class="btn" :disabled="exporting" @click="openSummaryPicker">
      <Icon name="summary" :size="16" /><span>{{ $t('actions.summary') }}</span>
    </button>
    <button class="btn" :disabled="exporting" @click="exportFullSummary">
      <Icon name="summary" :size="16" /><span>{{ $t('actions.fullSummary') }}</span>
    </button>
    <button class="btn" @click="emit('payroll')">
      <Icon name="payroll" :size="16" /><span>{{ $t('actions.payroll') }}</span>
    </button>
    <span v-if="exportError" class="error-flag">
      <span class="dot"></span>{{ $t('export.' + exportError) }}
    </span>

    <button class="btn icon-only" :disabled="!jobs.canUndo.value" :title="$t('actions.undo')" @click="jobs.undo()">
      <Icon name="undo" :size="16" />
    </button>
    <button class="btn icon-only" :disabled="!jobs.canRedo.value" :title="$t('actions.redo')" @click="jobs.redo()">
      <Icon name="redo" :size="16" />
    </button>
  </div>

  <!-- Grid -->
  <div class="content">
    <div class="card">
      <div class="grid-head">
        <div class="h">{{ $t('columns.projectType') }}</div>
        <div class="h">{{ $t('columns.dateTime') }}</div>
        <div class="h">{{ $t('columns.namePhone') }}</div>
        <div class="h">{{ $t('columns.inOut') }}</div>
        <div class="h">{{ $t('columns.unitPrice') }}</div>
        <div class="h">{{ $t('columns.quantity') }}</div>
        <div class="h">{{ $t('columns.workerCount') }}</div>
        <div class="h">{{ $t('columns.total') }}</div>
        <div class="h">{{ $t('columns.note') }}</div>
        <div class="h"></div>
      </div>

      <div v-if="jobs.rows.value.length === 0" class="empty-state">
        {{ $t('status.empty') }}
      </div>

      <JobRow
        v-for="(row, i) in pagedRows"
        :key="row._key"
        :row="row"
        :jobs="jobs"
        :workers="workers"
        @delete="jobs.removeRow(absoluteIndex(i))"
      />
    </div>
  </div>

  <!-- Bottom search / filters -->
  <FilterBar @apply="jobs.applyFilters" @clear="jobs.clearFilters" />

  <MonthPickerModal
    v-if="showMonthPicker"
    :years="[jobs.filters.value.year]"
    @confirm="confirmSummaryDownload"
    @cancel="showMonthPicker = false"
  />
</template>
