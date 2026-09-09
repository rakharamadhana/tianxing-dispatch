import {
  loadStyledWorkbook,
  downloadWorkbook,
  applyStyle,
  styleRow,
  addTitleRow
} from './xlsxTemplate.js'
import { payroll } from './payroll.js'

const ROLE_NAMES = { manager: '管理員', driver: '司機', assistant: '助理' }
const MONTH_NAMES = Array.from({ length: 12 }, (_, index) => `${index + 1}月`)

function roleName(role) {
  return ROLE_NAMES[role] || role
}

/** 'YYYYMMDD' -> a real Date (or null if not a full date) */
function parseJobDate(jobDate) {
  const s = String(jobDate || '')
  if (!/^\d{8}$/.test(s)) return null
  return new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)))
}

function jobMonthKey(job) {
  const s = String(job.job_date || '')
  return /^\d{8}$/.test(s) ? s.slice(0, 6) : ''
}

function jobLabel(job) {
  return job.customer_name || job.project_type || ''
}

/** One row per (job, worker) payout. */
function buildPayoutRows(jobs, workerRoster) {
  const rows = []
  jobs.forEach((job) => {
    if (!job.member_ids?.length) return
    payroll(job, workerRoster).rows.forEach((row) => {
      rows.push({
        workerId: row.id,
        name: row.name,
        role: row.role,
        date: job.job_date,
        project: jobLabel(job),
        amount: row.takeHome
      })
    })
  })
  return rows
}

function buildWorkerTotals(payoutRows) {
  const totals = new Map()
  payoutRows.forEach((row) => {
    if (!totals.has(row.workerId)) {
      totals.set(row.workerId, { workerId: row.workerId, name: row.name, role: row.role, total: 0 })
    }
    totals.get(row.workerId).total += row.amount
  })
  return [...totals.values()].sort((a, b) => b.total - a.total)
}

function buildDetailSheet(workbook, name, payoutRows, styles) {
  const sheet = workbook.addWorksheet(name)
  const header = ['日期', '人員', '職位', '項目', '金額']
  sheet.columns = [
    { key: 'date', width: 12 },
    { key: 'name', width: 16 },
    { key: 'role', width: 10 },
    { key: 'project', width: 26 },
    { key: 'amount', width: 14 }
  ]

  applyStyle(addTitleRow(sheet, name, header.length), styles.title)

  const headerRow = sheet.getRow(2)
  header.forEach((label, index) => { headerRow.getCell(index + 1).value = label })
  styleRow(headerRow, styles.header, header.length)

  ;[...payoutRows]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach((row, index) => {
      const excelRow = sheet.getRow(3 + index)
      excelRow.getCell(1).value = parseJobDate(row.date)
      excelRow.getCell(1).numFmt = 'mm"月"dd"日"'
      excelRow.getCell(2).value = row.name
      excelRow.getCell(3).value = roleName(row.role)
      excelRow.getCell(4).value = row.project
      excelRow.getCell(5).value = row.amount
      styleRow(excelRow, styles.data, header.length)
    })

  return sheet
}

function buildTotalsSheet(workbook, name, totals, styles) {
  const sheet = workbook.addWorksheet(name)
  const header = ['人員', '職位', '金額']
  sheet.columns = [
    { key: 'name', width: 16 },
    { key: 'role', width: 10 },
    { key: 'total', width: 14 }
  ]

  applyStyle(addTitleRow(sheet, name, header.length), styles.title)

  const headerRow = sheet.getRow(2)
  header.forEach((label, index) => { headerRow.getCell(index + 1).value = label })
  styleRow(headerRow, styles.header, header.length)

  totals.forEach((row, index) => {
    const excelRow = sheet.getRow(3 + index)
    excelRow.getCell(1).value = row.name
    excelRow.getCell(2).value = roleName(row.role)
    excelRow.getCell(3).value = row.total
    styleRow(excelRow, styles.data, header.length)
  })

  const totalRow = sheet.getRow(3 + totals.length)
  totalRow.getCell(1).value = '總計'
  totalRow.getCell(3).value = totals.reduce((sum, row) => sum + row.total, 0)
  styleRow(totalRow, styles.sectionTotal, header.length)

  return sheet
}

function buildMonthlyMatrixSheet(workbook, name, yearJobs, year, workerRoster, styles) {
  const monthlyPayoutRows = Array.from({ length: 12 }, (_, monthIndex) => {
    const key = `${year}${String(monthIndex + 1).padStart(2, '0')}`
    return buildPayoutRows(yearJobs.filter((job) => jobMonthKey(job) === key), workerRoster)
  })

  const workerMap = new Map()
  monthlyPayoutRows.forEach((rowsForMonth, monthIndex) => {
    rowsForMonth.forEach((row) => {
      if (!workerMap.has(row.workerId)) {
        workerMap.set(row.workerId, { name: row.name, role: row.role, monthly: Array(12).fill(0) })
      }
      workerMap.get(row.workerId).monthly[monthIndex] += row.amount
    })
  })

  const header = ['人員', '職位', ...MONTH_NAMES, '整年']
  const sheet = workbook.addWorksheet(name)
  sheet.columns = [
    { key: 'name', width: 16 },
    { key: 'role', width: 10 },
    ...MONTH_NAMES.map((_, index) => ({ key: `m${index}`, width: 11 })),
    { key: 'yearTotal', width: 12 }
  ]

  applyStyle(addTitleRow(sheet, name, header.length), styles.title)

  const headerRow = sheet.getRow(2)
  header.forEach((label, index) => { headerRow.getCell(index + 1).value = label })
  styleRow(headerRow, styles.header, header.length)

  const workers = [...workerMap.values()].sort((a, b) => (
    b.monthly.reduce((sum, value) => sum + value, 0) - a.monthly.reduce((sum, value) => sum + value, 0)
  ))

  workers.forEach((worker, index) => {
    const excelRow = sheet.getRow(3 + index)
    excelRow.getCell(1).value = worker.name
    excelRow.getCell(2).value = roleName(worker.role)
    worker.monthly.forEach((value, monthIndex) => { excelRow.getCell(3 + monthIndex).value = value })
    excelRow.getCell(15).value = worker.monthly.reduce((sum, value) => sum + value, 0)
    styleRow(excelRow, styles.data, header.length)
  })

  const totalsRow = sheet.getRow(3 + workers.length)
  totalsRow.getCell(1).value = '總計'
  for (let m = 0; m < 12; m += 1) {
    totalsRow.getCell(3 + m).value = workers.reduce((sum, worker) => sum + worker.monthly[m], 0)
  }
  totalsRow.getCell(15).value = workers.reduce((sum, worker) => sum + worker.monthly.reduce((s, v) => s + v, 0), 0)
  styleRow(totalsRow, styles.sectionTotal, header.length)

  return sheet
}

/** Full Summary (全總表): the whole year — a monthly worker matrix + full detail. */
export async function buildYearlySalaryWorkbook({ jobs, workerRoster, branch, year }) {
  const yearJobs = jobs.filter((job) => job.member_ids?.length && String(job.job_date).startsWith(String(year)))
  const { workbook, styles } = await loadStyledWorkbook()
  buildMonthlyMatrixSheet(workbook, `${branch} ${year}年度薪資總表`, yearJobs, year, workerRoster, styles)
  buildDetailSheet(workbook, '薪資明細', buildPayoutRows(yearJobs, workerRoster), styles)
  return workbook
}

/** Summary (總表): the given month's jobs — per-worker totals + detail. */
export async function buildMonthlySalaryWorkbook({ jobs, workerRoster, branch, year, month }) {
  const monthKey = `${year}${String(month).padStart(2, '0')}`
  const monthJobs = jobs.filter((job) => job.member_ids?.length && jobMonthKey(job) === monthKey)
  const payoutRows = buildPayoutRows(monthJobs, workerRoster)
  const totals = buildWorkerTotals(payoutRows)

  const { workbook, styles } = await loadStyledWorkbook()
  buildTotalsSheet(workbook, `${branch} ${year}年${month}月薪資總表`, totals, styles)
  buildDetailSheet(workbook, '薪資明細', payoutRows, styles)
  return workbook
}

export async function downloadYearlySalaryReport({ jobs, workerRoster, branch, year, filename }) {
  const workbook = await buildYearlySalaryWorkbook({ jobs, workerRoster, branch, year })
  await downloadWorkbook(workbook, filename)
}

export async function downloadMonthlySalaryReport({ jobs, workerRoster, branch, year, month, filename }) {
  const workbook = await buildMonthlySalaryWorkbook({ jobs, workerRoster, branch, year, month })
  await downloadWorkbook(workbook, filename)
}
