import { totalFor } from '../config/projectTypes.js'

/**
 * Ports TianXing-Project's payroll() model (src/store.js) onto this app's
 * job rows: driver/manager = 2 "units", assistant = 1 unit; a job's income
 * splits evenly across units, then each worker's configured commission %
 * applies to their unit share. The remainder is the company's cut.
 */
export const isDriverUnit = (role) => role === 'driver' || role === 'manager'

/** Same 5% tax deduction TianXing-Project applies before splitting a taxed job's income. */
export function jobActualIncome(job) {
  const base = Number(job.total_price ?? totalFor(job)) || 0
  return job.tax_status === '含稅' ? base * 0.95 : base
}

/**
 * @param job a job row with member_ids (string[]) and member_percentages ({id: number})
 * @param workerRoster a Map or plain object of worker id -> {id, name, role}
 * @returns { rows: [{id, name, role, gross, adminShare, takeHome, percentage}], unitValue, adminShare }
 */
export function payroll(job, workerRoster) {
  const lookup = (id) => (workerRoster instanceof Map ? workerRoster.get(id) : workerRoster?.[id])
  const members = (job.member_ids || []).map(lookup).filter(Boolean)

  const driverCount = members.filter((m) => isDriverUnit(m.role)).length
  const assistantCount = members.length - driverCount
  const units = driverCount * 2 + assistantCount
  const income = jobActualIncome(job)
  const unitValue = units ? income / units : 0
  const percentages = job.member_percentages || {}

  const rows = members.map((member) => {
    const configured = Number(percentages[member.id])
    const percentage = Number.isFinite(configured) ? configured / 100 : 1
    const unitShare = unitValue * (isDriverUnit(member.role) ? 2 : 1)
    const gross = unitShare * percentage
    return { ...member, gross, adminShare: unitShare - gross, takeHome: gross, percentage: percentage * 100 }
  })

  return {
    rows,
    unitValue,
    adminShare: rows.reduce((sum, row) => sum + row.adminShare, 0)
  }
}
