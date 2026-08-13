export const PROJECT_TYPES = ['搬工', '包材', '時薪']
const HOURLY_TYPES = ['包材', '時薪']

export const isHourlyType = (type) => HOURLY_TYPES.includes(type)
export const usesMaterials = (type) => type === '包材'
export const requiresMaterials = (type) => type === '包材'

/** Mirrors src/main/repository/SqliteJobRepository.js#totalFor (renderer can't import main-process code). */
export function totalFor(row) {
  const price = Number(row.unit_price) || 0
  const qty = Number(row.quantity) || 0
  return isHourlyType(row.project_type) ? price * qty * (Number(row.worker_count) || 0) : price * qty
}
