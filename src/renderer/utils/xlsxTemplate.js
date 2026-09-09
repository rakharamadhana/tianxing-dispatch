import ExcelJS from 'exceljs'

/**
 * Shared with the TianXing driver app: reuses the same styled workbook
 * (fonts/fills/borders) so exports from both apps look like one document
 * family. See TianXing-Project/src/utils/xlsxTemplate.js.
 */

const TEMPLATE_URL = '/templates/income-statement-template.xlsx'

export async function loadTemplateWorkbook() {
  const response = await fetch(TEMPLATE_URL)
  const buffer = await response.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  return workbook
}

export function downloadWorkbook(workbook, filename) {
  // ExcelJS never evaluates formulas — it writes formula text with no cached
  // result. Force Excel to recalculate everything on open, otherwise cells
  // like the template's "共"/整年 SUM formulas can show stale/blank values
  // instead of the numbers we just wrote into their source cells.
  workbook.calcProperties = { ...workbook.calcProperties, fullCalcOnLoad: true }
  return workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  })
}

const cellBorder = { style: 'thin', color: { indexed: 64 } }

/**
 * Pulls real font/fill/border objects off the template so freshly-built
 * sheets look like the same document family instead of default styling.
 */
export function captureTemplateStyles(workbook) {
  const blank = workbook.getWorksheet('空白')
  const summary = workbook.getWorksheet('2026')

  return {
    title: {
      font: { ...blank.getCell('A1').font },
      fill: { ...blank.getCell('A1').fill },
      alignment: { horizontal: 'center', vertical: 'middle' }
    },
    header: {
      font: { ...blank.getCell('A2').font },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: cellBorder, left: cellBorder, right: cellBorder, bottom: cellBorder }
    },
    sectionTotal: {
      font: { ...summary.getCell('A5').font, bold: true },
      fill: { ...summary.getCell('A5').fill },
      border: { top: cellBorder, left: cellBorder, right: cellBorder, bottom: cellBorder }
    },
    data: {
      font: { ...blank.getCell('B3').font },
      border: { top: cellBorder, left: cellBorder, right: cellBorder, bottom: cellBorder }
    }
  }
}

export function applyStyle(cell, style) {
  if (style.font) cell.font = style.font
  if (style.fill) cell.fill = style.fill
  if (style.border) cell.border = style.border
  if (style.alignment) cell.alignment = style.alignment
}

export function styleRow(row, style, colCount) {
  for (let col = 1; col <= colCount; col += 1) applyStyle(row.getCell(col), style)
}

export function addTitleRow(sheet, title, colCount) {
  sheet.mergeCells(1, 1, 1, colCount)
  const cell = sheet.getCell(1, 1)
  cell.value = title
  sheet.getRow(1).height = 32
  return cell
}

/** Loads the template, captures its styles, and strips its own sample sheets. */
export async function loadStyledWorkbook() {
  const workbook = await loadTemplateWorkbook()
  const styles = captureTemplateStyles(workbook)

  ;['2026', '空白', '1月'].forEach((name) => {
    const sheet = workbook.getWorksheet(name)
    if (sheet) workbook.removeWorksheet(sheet.id)
  })

  return { workbook, styles }
}
