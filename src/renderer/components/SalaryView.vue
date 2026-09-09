<script setup>
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'
import MonthPickerModal from './MonthPickerModal.vue'
import { useWorkers } from '../composables/useWorkers.js'
import { payroll } from '../utils/payroll.js'
import {
  downloadMonthlySalaryReport,
  downloadYearlySalaryReport
} from '../utils/salaryReport.js'

const props = defineProps({
  jobs: { type: Object, required: true } // the useJobs() instance
})
const emit = defineEmits(['back'])

const { workers, load: loadWorkers } = useWorkers(props.jobs.branch.value)
watch(() => props.jobs.branch.value, loadWorkers)

const workerRoster = computed(() => Object.fromEntries(workers.value.map((w) => [w.id, w])))

/** 'YYYYMMDD' -> 'YYYY-MM-DD' (or '' if it doesn't parse) */
function isoDate(jobDate) {
  const d = String(jobDate || '')
  return /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : ''
}

/** 'YYYYMMDD' + 'HH:MM' -> 'YYYY-MM-DD HH:MM' (falls back to just the date, or '' if neither parses) */
function formatJobDateTime(job) {
  const date = isoDate(job.job_date)
  if (!date) return ''
  const time = String(job.job_time || '')
  return /^\d{2}:\d{2}/.test(time) ? `${date} ${time.slice(0, 5)}` : date
}

/** Mirrors salaryReport.js#jobLabel — customer name if set, else the service type. */
function jobLabel(job) {
  return job.customer_name || job.project_type || ''
}

const allPayouts = computed(() => {
  const list = []
  props.jobs.rows.value
    .filter((job) => job.member_ids?.length)
    .forEach((job) => {
      const dateTime = formatJobDateTime(job)
      const project = jobLabel(job)
      payroll(job, workerRoster.value).rows.forEach((row) => {
        list.push({
          workerId: row.id,
          name: row.name,
          role: row.role,
          amount: row.takeHome,
          jobDate: job.job_date || '',
          jobDateIso: isoDate(job.job_date),
          dateTime,
          project
        })
      })
    })
  return list
})

const filterWorker = ref('')
const filterProject = ref('')
const filterFrom = ref('')
const filterTo = ref('')

const workerOptions = computed(() => {
  const seen = new Map()
  allPayouts.value.forEach((p) => { if (!seen.has(p.workerId)) seen.set(p.workerId, p.name) })
  return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})

function clearFilters() {
  filterWorker.value = ''
  filterProject.value = ''
  filterFrom.value = ''
  filterTo.value = ''
}

const filteredPayouts = computed(() => {
  const project = filterProject.value.trim().toLowerCase()
  return allPayouts.value.filter((p) => {
    if (filterWorker.value && p.workerId !== filterWorker.value) return false
    if (project && !p.project.toLowerCase().includes(project)) return false
    if (filterFrom.value && (!p.jobDateIso || p.jobDateIso < filterFrom.value)) return false
    if (filterTo.value && (!p.jobDateIso || p.jobDateIso > filterTo.value)) return false
    return true
  })
})

const sortField = ref('date')
const sortDir = ref('desc')

function toggleSort(field) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = field === 'name' || field === 'role' ? 'asc' : 'desc'
  }
}

function sortIndicator(field) {
  if (sortField.value !== field) return ''
  return sortDir.value === 'asc' ? '▲' : '▼'
}

const rows = computed(() => {
  const field = sortField.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filteredPayouts.value].sort((a, b) => {
    if (field === 'name') return a.name.localeCompare(b.name) * dir
    if (field === 'role') return a.role.localeCompare(b.role) * dir
    if (field === 'project') return a.project.localeCompare(b.project) * dir
    if (field === 'date') return a.jobDate.localeCompare(b.jobDate) * dir
    return (a.amount - b.amount) * dir
  })
})

const totalSalary = computed(() => filteredPayouts.value.reduce((sum, payout) => sum + payout.amount, 0))

function money(value) {
  return Math.round(Number(value) || 0).toLocaleString()
}

const availableYears = computed(() => [Number(props.jobs.filters.value.year) || new Date().getFullYear()])

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
    await downloadMonthlySalaryReport({
      jobs: props.jobs.rows.value,
      workerRoster: workerRoster.value,
      branch: props.jobs.branch.value,
      year,
      month,
      filename: `${props.jobs.branch.value}-${year}-${month}-薪資總表.xlsx`
    })
    showMonthPicker.value = false
  } catch (e) {
    console.error('Salary summary export failed', e)
    exportError.value = 'error'
  } finally {
    exporting.value = false
  }
}

async function confirmFullSummaryDownload({ year }) {
  exportError.value = ''
  exporting.value = true
  try {
    await downloadYearlySalaryReport({
      jobs: props.jobs.rows.value,
      workerRoster: workerRoster.value,
      branch: props.jobs.branch.value,
      year,
      filename: `${props.jobs.branch.value}-${year}-薪資全總表.xlsx`
    })
    showYearPicker.value = false
  } catch (e) {
    console.error('Salary full summary export failed', e)
    exportError.value = 'error'
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="content">
    <div class="profile-header">
      <button class="btn ghost back-btn" @click="emit('back')">
        <Icon name="chevron-left" :size="16" />
        <span>{{ $t('salary.back') }}</span>
      </button>
      <h1 class="profile-title">{{ $t('salary.title') }}</h1>
    </div>

    <div class="toolbar">
      <span class="salary-total-chip">
        {{ $t('salary.total') }} <strong>{{ money(totalSalary) }}</strong>
      </span>

      <span class="grow"></span>

      <button class="btn" :disabled="exporting || !allPayouts.length" @click="openSummaryPicker">
        <Icon name="summary" :size="16" /><span>{{ $t('actions.summary') }}</span>
      </button>
      <button class="btn" :disabled="exporting || !allPayouts.length" @click="openFullSummaryPicker">
        <Icon name="summary" :size="16" /><span>{{ $t('actions.fullSummary') }}</span>
      </button>
      <span v-if="exportError" class="error-flag">
        <span class="dot"></span>{{ $t('export.' + exportError) }}
      </span>
    </div>

    <div class="filterbar">
      <div class="search-field">
        <Icon name="search" :size="15" />
        <input v-model="filterProject" :placeholder="$t('salary.filters.searchProject')" />
      </div>

      <span class="filter-group">
        <span class="filter-label">{{ $t('salary.filters.worker') }}</span>
        <select v-model="filterWorker" class="select-input">
          <option value="">{{ $t('salary.filters.allWorkers') }}</option>
          <option v-for="w in workerOptions" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </span>

      <span class="filter-group">
        <span class="filter-label">{{ $t('salary.filters.from') }}</span>
        <input v-model="filterFrom" type="date" />
        <span class="filter-label">{{ $t('salary.filters.to') }}</span>
        <input v-model="filterTo" type="date" />
      </span>

      <span class="grow"></span>
      <button class="btn small" @click="clearFilters">{{ $t('filters.clear') }}</button>
    </div>

    <div class="card salary-grid">
      <div class="grid-head">
        <div class="h sortable" @click="toggleSort('date')">{{ $t('salary.columns.date') }} {{ sortIndicator('date') }}</div>
        <div class="h sortable" @click="toggleSort('name')">{{ $t('salary.columns.worker') }} {{ sortIndicator('name') }}</div>
        <div class="h sortable" @click="toggleSort('role')">{{ $t('salary.columns.role') }} {{ sortIndicator('role') }}</div>
        <div class="h sortable" @click="toggleSort('project')">{{ $t('salary.columns.project') }} {{ sortIndicator('project') }}</div>
        <div class="h sortable" @click="toggleSort('amount')">{{ $t('salary.columns.amount') }} {{ sortIndicator('amount') }}</div>
      </div>

      <div v-if="!rows.length" class="empty-state">
        {{ $t('salary.noRecords') }}
      </div>

      <div v-for="(row, i) in rows" :key="`${row.workerId}-${row.jobDate}-${i}`" class="job-row">
        <div class="cell">{{ row.dateTime || '—' }}</div>
        <div class="cell">{{ row.name }}</div>
        <div class="cell">{{ $t('salary.roles.' + row.role) }}</div>
        <div class="cell">{{ row.project || '—' }}</div>
        <div class="cell cell-amount">{{ money(row.amount) }}</div>
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
.salary-total-chip {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-soft);
}
.salary-total-chip strong {
  font-size: 16px;
  color: var(--ink);
  margin-left: 6px;
}
.salary-grid .grid-head,
.salary-grid .job-row {
  grid-template-columns: 150px 1fr 100px 1fr 140px;
}
.filterbar select,
.filterbar input[type='date'] {
  min-height: var(--control-h);
  border: 1px solid #cbd7e5;
  border-radius: 5px;
  padding: 0 8px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
}
.h.sortable {
  cursor: pointer;
  user-select: none;
}
.cell-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
</style>
