import {
  loadStyledWorkbook,
  downloadWorkbook,
  applyStyle,
  styleRow,
  addTitleRow
} from './xlsxTemplate.js'

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) => `${index + 1}月`)

/** created_at is a Postgres timestamptz string, e.g. '2026-08-30 13:52:26+00'. */
function dateKey(record) {
  const match = String(record.created_at || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

function description(row) {
  return [row.address, row.note].filter(Boolean).join(' ')
}

function buildDetailSheet(workbook, name, rows, styles) {
  const sheet = workbook.addWorksheet(name)
  const header = ['日期時間', '司機', '金額', '說明', '狀態']
  sheet.columns = [
    { key: 'datetime', width: 18 },
    { key: 'driver', width: 16 },
    { key: 'amount', width: 14 },
    { key: 'description', width: 32 },
    { key: 'status', width: 12 }
  ]

  applyStyle(addTitleRow(sheet, name, header.length), styles.title)

  const headerRow = sheet.getRow(2)
  header.forEach((label, index) => { headerRow.getCell(index + 1).value = label })
  styleRow(headerRow, styles.header, header.length)

  const sorted = [...rows].sort((a, b) => (dateKey(a) < dateKey(b) ? -1 : 1))
  sorted.forEach((row, index) => {
    const excelRow = sheet.getRow(3 + index)
    excelRow.getCell(1).value = row.created_at || ''
    excelRow.getCell(2).value = row.driver_name || ''
    excelRow.getCell(3).value = Number(row.amount) || 0
    excelRow.getCell(4).value = description(row)
    excelRow.getCell(5).value = row.status || ''
    styleRow(excelRow, styles.data, header.length)
  })

  const totalRow = sheet.getRow(3 + sorted.length)
  totalRow.getCell(1).value = '總計'
  totalRow.getCell(3).value = sorted.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  styleRow(totalRow, styles.sectionTotal, header.length)

  return sheet
}

function buildDriverTotalsSheet(workbook, name, rows, styles) {
  const sheet = workbook.addWorksheet(name)
  const header = ['司機', '筆數', '金額']
  sheet.columns = [
    { key: 'driver', width: 16 },
    { key: 'count', width: 10 },
    { key: 'amount', width: 14 }
  ]

  applyStyle(addTitleRow(sheet, name, header.length), styles.title)

  const headerRow = sheet.getRow(2)
  header.forEach((label, index) => { headerRow.getCell(index + 1).value = label })
  styleRow(headerRow, styles.header, header.length)

  const totals = new Map()
  rows.forEach((row) => {
    const key = row.driver_name || ''
    if (!totals.has(key)) totals.set(key, { name: key, count: 0, amount: 0 })
    const entry = totals.get(key)
    entry.count += 1
    entry.amount += Number(row.amount) || 0
  })

  const driverList = [...totals.values()].sort((a, b) => b.amount - a.amount)
  driverList.forEach((driver, index) => {
    const excelRow = sheet.getRow(3 + index)
    excelRow.getCell(1).value = driver.name
    excelRow.getCell(2).value = driver.count
    excelRow.getCell(3).value = driver.amount
    styleRow(excelRow, styles.data, header.length)
  })

  const totalRow = sheet.getRow(3 + driverList.length)
  totalRow.getCell(1).value = '總計'
  totalRow.getCell(2).value = driverList.reduce((sum, d) => sum + d.count, 0)
  totalRow.getCell(3).value = driverList.reduce((sum, d) => sum + d.amount, 0)
  styleRow(totalRow, styles.sectionTotal, header.length)

  return sheet
}

function buildYearMatrixSheet(workbook, name, yearRows, styles) {
  const header = ['月份', '筆數', '金額']
  const sheet = workbook.addWorksheet(name)
  sheet.columns = [
    { key: 'label', width: 10 },
    { key: 'count', width: 10 },
    { key: 'amount', width: 14 }
  ]

  applyStyle(addTitleRow(sheet, name, header.length), styles.title)

  const headerRow = sheet.getRow(2)
  header.forEach((label, index) => { headerRow.getCell(index + 1).value = label })
  styleRow(headerRow, styles.header, header.length)

  const monthly = MONTH_NAMES.map((label, index) => {
    const monthKey = String(index + 1).padStart(2, '0')
    const rows = yearRows.filter((row) => dateKey(row).slice(5, 7) === monthKey)
    return { label, count: rows.length, amount: rows.reduce((s, r) => s + (Number(r.amount) || 0), 0) }
  })

  monthly.forEach((m, index) => {
    const row = sheet.getRow(3 + index)
    row.getCell(1).value = m.label
    row.getCell(2).value = m.count
    row.getCell(3).value = m.amount
    styleRow(row, styles.data, header.length)
  })

  const totalRow = sheet.getRow(3 + monthly.length)
  totalRow.getCell(1).value = '總計'
  totalRow.getCell(2).value = monthly.reduce((s, m) => s + m.count, 0)
  totalRow.getCell(3).value = monthly.reduce((s, m) => s + m.amount, 0)
  styleRow(totalRow, styles.sectionTotal, header.length)

  return sheet
}

/** Summary (總表): the given month's maintenance requests — driver totals + detail. */
export async function buildMonthlyMaintenanceWorkbook({ records, branch, year, month }) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const monthRows = records.filter((row) => dateKey(row).startsWith(monthKey))

  const { workbook, styles } = await loadStyledWorkbook()
  buildDriverTotalsSheet(workbook, `${branch} ${year}年${month}月保養總表`, monthRows, styles)
  buildDetailSheet(workbook, '明細', monthRows, styles)
  return workbook
}

/** Full Summary (全總表): the whole year — a monthly matrix + full detail. */
export async function buildYearlyMaintenanceWorkbook({ records, branch, year }) {
  const yearRows = records.filter((row) => dateKey(row).startsWith(String(year)))

  const { workbook, styles } = await loadStyledWorkbook()
  buildYearMatrixSheet(workbook, `${branch} ${year}年度保養總表`, yearRows, styles)
  buildDetailSheet(workbook, '明細', yearRows, styles)
  return workbook
}

export async function downloadMonthlyMaintenanceReport({ records, branch, year, month, filename }) {
  const workbook = await buildMonthlyMaintenanceWorkbook({ records, branch, year, month })
  await downloadWorkbook(workbook, filename)
}

export async function downloadYearlyMaintenanceReport({ records, branch, year, filename }) {
  const workbook = await buildYearlyMaintenanceWorkbook({ records, branch, year })
  await downloadWorkbook(workbook, filename)
}
