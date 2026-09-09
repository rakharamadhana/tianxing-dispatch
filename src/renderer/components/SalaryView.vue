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

const allPayouts = computed(() => {
  const list = []
  props.jobs.rows.value
    .filter((job) => job.member_ids?.length)
    .forEach((job) => {
      payroll(job, workerRoster.value).rows.forEach((row) => {
        list.push({ workerId: row.id, name: row.name, role: row.role, amount: row.takeHome })
      })
    })
  return list
})

const sortField = ref('total')
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
  const totals = new Map()
  allPayouts.value.forEach((payout) => {
    if (!totals.has(payout.workerId)) {
      totals.set(payout.workerId, { id: payout.workerId, name: payout.name, role: payout.role, total: 0 })
    }
    totals.get(payout.workerId).total += payout.amount
  })

  const field = sortField.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...totals.values()].sort((a, b) => {
    if (field === 'name') return a.name.localeCompare(b.name) * dir
    if (field === 'role') return a.role.localeCompare(b.role) * dir
    return (a.total - b.total) * dir
  })
})

const totalSalary = computed(() => rows.value.reduce((sum, row) => sum + row.total, 0))

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

    <div class="card salary-grid">
      <div class="grid-head">
        <div class="h sortable" @click="toggleSort('name')">{{ $t('salary.columns.worker') }} {{ sortIndicator('name') }}</div>
        <div class="h sortable" @click="toggleSort('role')">{{ $t('salary.columns.role') }} {{ sortIndicator('role') }}</div>
        <div class="h sortable" @click="toggleSort('total')">{{ $t('salary.columns.amount') }} {{ sortIndicator('total') }}</div>
      </div>

      <div v-if="!rows.length" class="empty-state">
        {{ $t('salary.noRecords') }}
      </div>

      <div v-for="row in rows" :key="row.id" class="job-row">
        <div class="cell">{{ row.name }}</div>
        <div class="cell">{{ $t('salary.roles.' + row.role) }}</div>
        <div class="cell cell-amount">{{ money(row.total) }}</div>
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
  grid-template-columns: 1fr 120px 140px;
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
