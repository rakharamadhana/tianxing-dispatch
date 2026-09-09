import { downloadWorkbook, loadTemplateWorkbook } from './xlsxTemplate.js'
import { payroll, jobActualIncome, isDriverUnit } from './payroll.js'

/**
 * Mirrors TianXing-Project's src/utils/incomeStatement.js: clones the
 * template's own '空白' sheet per month (preserving its styles/merges) and
 * fills the same 11-column transaction layout, then fills the template's
 * own formula-driven yearly Revenue/Cost-by-branch summary sheet.
 *
 * Unlike TianXing-Project (single-branch, no branch data — everything lands
 * in the first "台北" column), this app has real per-branch jobs, so the
 * summary fills all three branch columns and lets the template's own "共"
 * SUM formulas roll them up.
 */

const BRANCH_ORDER = ['台北', '新竹', '高雄']

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

function cloneSheet(workbook, sourceSheet, newName) {
  const newSheet = workbook.addWorksheet(newName, {
    views: sourceSheet.views,
    properties: sourceSheet.properties
  })

  sourceSheet.columns.forEach((col, index) => {
    newSheet.getColumn(index + 1).width = col.width
  })

  sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const newRow = newSheet.getRow(rowNumber)
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber)
      newCell.value = cell.value
      newCell.style = { ...cell.style }
      newCell.numFmt = cell.numFmt
    })
    newRow.height = row.height
    newRow.commit()
  })

  sourceSheet.model.merges.forEach((range) => newSheet.mergeCells(range))
  return newSheet
}

// 空白 sheet schema: A=日期 B=客戶 C=金額 D=司機 E=分配金額 F=扣%後金額 G=助手 H=分配金額 I=扣%後金額 J=公司收入 K=備註
function buildJobRow(job, workerRoster) {
  const { rows, adminShare } = payroll(job, workerRoster)
  const drivers = rows.filter((row) => isDriverUnit(row.role))
  const assistants = rows.filter((row) => !isDriverUnit(row.role))
  const namesOf = (list) => list.map((row) => row.name).join('、')
  const allocatedOf = (list) => list.reduce((sum, row) => sum + row.gross + row.adminShare, 0)
  const takeHomeOf = (list) => list.reduce((sum, row) => sum + row.gross, 0)

  return {
    branch: job.branch,
    date: parseJobDate(job.job_date),
    customer: job.customer_name || '',
    amount: jobActualIncome(job),
    driverNames: namesOf(drivers),
    driverAllocated: allocatedOf(drivers),
    driverTakeHome: takeHomeOf(drivers),
    assistantNames: namesOf(assistants),
    assistantAllocated: allocatedOf(assistants),
    assistantTakeHome: takeHomeOf(assistants),
    companyIncome: adminShare,
    note: job.note || '',
    driverPayout: takeHomeOf(drivers),
    assistantPayout: takeHomeOf(assistants)
  }
}

function fillTransactionSheet(sheet, rows) {
  const startRow = 3
  rows.forEach((row, index) => {
    const excelRow = sheet.getRow(startRow + index)
    excelRow.getCell(1).value = row.date
    excelRow.getCell(1).numFmt = 'mm"月"dd"日"'
    excelRow.getCell(2).value = row.customer
    excelRow.getCell(3).value = row.amount
    excelRow.getCell(4).value = row.driverNames || ''
    excelRow.getCell(5).value = row.driverAllocated || 0
    excelRow.getCell(6).value = row.driverTakeHome || 0
    excelRow.getCell(7).value = row.assistantNames || ''
    excelRow.getCell(8).value = row.assistantAllocated || 0
    excelRow.getCell(9).value = row.assistantTakeHome || 0
    excelRow.getCell(10).value = row.companyIncome || 0
    excelRow.getCell(11).value = row.note || ''
    excelRow.commit()
  })
}

// 2026 sheet: each month occupies 4 columns (台北/新竹/高雄/共). Month 1 starts at column B (2).
function monthColumn(month, branchOffset) {
  return 2 + (month - 1) * 4 + branchOffset
}

// Cost section row numbers on the template's '2026' sheet (see its own row-A labels).
const COST_ROW = { salary: 13, fuel: 21, maintenance: 34 }

/** created_at is a Postgres timestamptz string, e.g. '2026-07-10 13:52:26+00'. */
function costMonthKey(record) {
  const match = String(record.created_at || '').match(/^(\d{4})-(\d{2})/)
  return match ? `${match[1]}${match[2]}` : ''
}

/** Only approved requests are an actual cost — pending/rejected ones aren't paid out. */
function fuelApprovedAmount(record) {
  return record.status === 'approved' ? Number(record.approved_amount) || 0 : 0
}
function maintenanceApprovedAmount(record) {
  return record.status === 'approved' ? Number(record.amount) || 0 : 0
}

function writeCostRow(sheet, rowNumber, month, recordsForMonth, amountOf) {
  BRANCH_ORDER.forEach((branchLabel, offset) => {
    const total = recordsForMonth
      .filter((record) => record.branch === branchLabel)
      .reduce((sum, record) => sum + amountOf(record), 0)
    sheet.getRow(rowNumber).getCell(monthColumn(month, offset)).value = total
  })
}

function fillYearSummary(sheet, month, rowsForMonth, monthFuel, monthMaintenance) {
  BRANCH_ORDER.forEach((branchLabel, offset) => {
    const branchRows = rowsForMonth.filter((row) => row.branch === branchLabel)
    const revenue = branchRows.reduce((sum, row) => sum + row.amount, 0)
    const payout = branchRows.reduce((sum, row) => sum + row.driverPayout + row.assistantPayout, 0)
    const col = monthColumn(month, offset)
    sheet.getRow(6).getCell(col).value = revenue
    sheet.getRow(COST_ROW.salary).getCell(col).value = payout
  })
  writeCostRow(sheet, COST_ROW.fuel, month, monthFuel, fuelApprovedAmount)
  writeCostRow(sheet, COST_ROW.maintenance, month, monthMaintenance, maintenanceApprovedAmount)
}

export async function buildMonthlyJobsWorkbook({ jobs, workerRoster, year, month }) {
  const monthKey = `${year}${String(month).padStart(2, '0')}`
  const rows = jobs
    .filter((job) => jobMonthKey(job) === monthKey)
    .sort((a, b) => (a.job_date < b.job_date ? -1 : 1))
    .map((job) => buildJobRow(job, workerRoster))

  const workbook = await loadTemplateWorkbook()
  const blankSheet = workbook.getWorksheet('空白')

  ;['2026', '1月'].forEach((name) => {
    const sheet = workbook.getWorksheet(name)
    if (sheet) workbook.removeWorksheet(sheet.id)
  })

  const monthSheet = cloneSheet(workbook, blankSheet, `${month}月`)
  fillTransactionSheet(monthSheet, rows)
  workbook.removeWorksheet(blankSheet.id)

  return workbook
}

export async function buildYearlyJobsWorkbook({ jobs, workerRoster, year, fuelRecords = [], maintenanceRecords = [] }) {
  const yearJobs = jobs.filter((job) => String(job.job_date).startsWith(String(year)))
  const yearFuel = fuelRecords.filter((r) => costMonthKey(r).startsWith(String(year)))
  const yearMaintenance = maintenanceRecords.filter((r) => costMonthKey(r).startsWith(String(year)))

  const workbook = await loadTemplateWorkbook()
  const summarySheet = workbook.getWorksheet('2026')
  summarySheet.name = String(year)

  const blankSheet = workbook.getWorksheet('空白')
  const sampleMonthSheet = workbook.getWorksheet('1月')
  if (sampleMonthSheet) workbook.removeWorksheet(sampleMonthSheet.id)

  for (let month = 1; month <= 12; month += 1) {
    const monthKey = `${year}${String(month).padStart(2, '0')}`
    const rows = yearJobs
      .filter((job) => jobMonthKey(job) === monthKey)
      .sort((a, b) => (a.job_date < b.job_date ? -1 : 1))
      .map((job) => buildJobRow(job, workerRoster))

    const monthSheet = cloneSheet(workbook, blankSheet, `${month}月`)
    fillTransactionSheet(monthSheet, rows)

    const monthFuel = yearFuel.filter((r) => costMonthKey(r) === monthKey)
    const monthMaintenance = yearMaintenance.filter((r) => costMonthKey(r) === monthKey)
    fillYearSummary(summarySheet, month, rows, monthFuel, monthMaintenance)
  }

  workbook.removeWorksheet(blankSheet.id)
  return workbook
}

export async function downloadMonthlyJobsReport({ jobs, workerRoster, year, month, filename }) {
  const workbook = await buildMonthlyJobsWorkbook({ jobs, workerRoster, year, month })
  await downloadWorkbook(workbook, filename)
}

export async function downloadYearlyJobsReport({ jobs, workerRoster, year, fuelRecords, maintenanceRecords, filename }) {
  const workbook = await buildYearlyJobsWorkbook({ jobs, workerRoster, year, fuelRecords, maintenanceRecords })
  await downloadWorkbook(workbook, filename)
}
