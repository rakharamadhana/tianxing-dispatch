import { randomUUID } from 'crypto'
import { JobRepository } from './JobRepository.js'
import { getSupabase } from '../supabaseClient.js'
import { labelToEnum, enumToLabel, ALL_LABEL, ALL_BRANCH_ENUMS } from '../branchMap.js'

/**
 * Reads/writes the app's dispatch jobs against the *existing* Supabase
 * `projects` table (shared with another, already-live app — payroll,
 * fuel/maintenance requests, driver accounts).
 *
 * Only fields that genuinely correspond are mapped. Several local fields
 * have no matching column in `projects` and are intentionally NOT persisted
 * here, to avoid guessing at / colliding with that other app's payroll
 * semantics (driver_hourly_rate, billing_type, etc.):
 *   unit_price, quantity, worker_count, payment_method, project_type,
 *   materials, sort_order.
 * These reset to their defaults on reload until dedicated columns exist.
 *
 * member_ids / member_percentages ARE mapped: this app's own worker-salary
 * feature reads/writes them the same way TianXing-Project's payroll
 * workflow does, on the same shared columns.
 */

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''))
}

/**
 * member_ids / member_percentages / transfer_status / received_by come back
 * from `projects` as JSON-encoded TEXT, not native array/jsonb — so
 * Array.isArray()/typeof checks on the raw value always fail. Parse either
 * shape defensively (a native value, if the column type ever changes; a
 * JSON string, which is what's actually there today).
 */
function parseJsonField(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return fallback
}

/** '2026-08-13' -> '20260813' */
function dateToJobDate(workDate) {
  return workDate ? String(workDate).replace(/-/g, '') : ''
}

/** '20260813' -> '2026-08-13' (or null if not a full YYYYMMDD date) */
function jobDateToWorkDate(jobDate) {
  const s = String(jobDate || '')
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null
}

/** '10:00:00' -> '10:00' */
function timeToJobTime(time) {
  return time ? String(time).slice(0, 5) : ''
}

/** 'HH:MM' -> 'HH:MM:00' (defaults to midnight; start_time is NOT NULL) */
function jobTimeToStartTime(jobTime) {
  const s = String(jobTime || '').trim()
  return /^\d{2}:\d{2}$/.test(s) ? `${s}:00` : '00:00:00'
}

/**
 * Read-only project completion status, mirroring TianXing-Project's own
 * isProjectComplete() (src/store.js) so this app can show the same
 * Pending/Complete signal for rows created through that app's payroll
 * workflow. Returns null (no badge) for rows with no payroll data at all —
 * e.g. ordinary jobs created directly in this dispatch table, which never
 * go through that workflow.
 */
function computeProjectStatus(row) {
  const members = parseJsonField(row.member_ids, [])
  if (!members.length) return null

  const amount = Number(row.amount) || 0
  if (!row.end_time || !amount) return 'pending'

  const transferStatus = parseJsonField(row.transfer_status, {})
  const receivedBy = parseJsonField(row.received_by, [])
  const allTransfersPaid = members.every((id) => transferStatus[id] === 'paid')
  const allConfirmed = members.every((id) => receivedBy.includes(id))
  return allTransfersPaid && allConfirmed ? 'complete' : 'pending'
}

function toJob(row) {
  return {
    id: row.id,
    branch: enumToLabel(row.branch) || '',
    project_type: '搬工',
    job_date: dateToJobDate(row.work_date),
    job_time: timeToJobTime(row.start_time),
    customer_name: row.customer_name || '',
    phone: row.customer_phone || '',
    move_in_address: row.moving_in_address || '',
    move_out_address: row.moving_out_address || '',
    unit_price: row.amount || 0,
    tax_status: row.tax_included ? '含稅' : '未稅',
    quantity: 1,
    worker_count: 0,
    total_price: row.amount || 0,
    payment_method: '現金',
    payment_status: row.paid ? '已付款' : '未付款',
    note: row.note || '',
    materials: [],
    sort_order: 0,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    // Read-only; never sent back on save (see toProjectRecord).
    project_status: computeProjectStatus(row),
    member_ids: parseJsonField(row.member_ids, []),
    member_percentages: parseJsonField(row.member_percentages, {})
  }
}

function toProjectRecord(job, fallbackBranchEnum) {
  return {
    // A row keeps whatever branch it was moved to (see JobRow's CEO-only
    // branch selector); fall back to the active tab only for brand-new rows
    // that haven't picked one yet.
    branch: labelToEnum(job.branch) || fallbackBranchEnum,
    work_date: jobDateToWorkDate(job.job_date),
    start_time: jobTimeToStartTime(job.job_time),
    customer_name: job.customer_name || '',
    customer_phone: job.phone || '',
    moving_in_address: job.move_in_address || '',
    moving_out_address: job.move_out_address || '',
    tax_included: job.tax_status === '含稅',
    paid: job.payment_status === '已付款',
    amount: Number(job.total_price ?? job.unit_price) || 0,
    note: job.note || '',
    // The column stores JSON-encoded text (confirmed against real rows —
    // see parseJsonField above), not native jsonb, so write the same shape.
    member_ids: JSON.stringify(Array.isArray(job.member_ids) ? job.member_ids : []),
    member_percentages: JSON.stringify(job.member_percentages && typeof job.member_percentages === 'object' ? job.member_percentages : {})
  }
}

export class SupabaseJobRepository extends JobRepository {
  async list(branch, filters = {}) {
    const supabase = getSupabase()
    if (!supabase) return []
    const branchEnum = labelToEnum(branch)
    if (!branchEnum && branch !== ALL_LABEL) return []

    let query = supabase.from('projects').select('*')
    query = branchEnum ? query.eq('branch', branchEnum) : query.in('branch', ALL_BRANCH_ENUMS)

    const { data, error } = await query
      .order('work_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('SupabaseJobRepository.list error:', error.message)
      return []
    }

    let jobs = data.map(toJob)

    if (filters.year) jobs = jobs.filter((j) => j.job_date.startsWith(String(filters.year)))
    if (filters.dateQuery) jobs = jobs.filter((j) => j.job_date.includes(filters.dateQuery))
    if (filters.phoneQuery) jobs = jobs.filter((j) => j.phone.includes(filters.phoneQuery))
    if (filters.taxFilter) jobs = jobs.filter((j) => j.tax_status === filters.taxFilter)
    if (filters.paymentStatus) jobs = jobs.filter((j) => j.payment_status === filters.paymentStatus)
    // payment_method has no column in `projects`; that filter can't be honored here.

    return jobs
  }

  async save(branch, payload) {
    const supabase = getSupabase()
    // Falsy (null) when branch is the All pseudo-branch — fine, since every
    // row already carries its own real branch (see toProjectRecord), and
    // brand-new rows added from the All tab default to a real branch too
    // (see useJobs#addRow).
    const branchEnum = labelToEnum(branch)
    const rows = payload.rows || []
    const deletedIds = payload.deletedIds || []
    if (!supabase) return []

    for (const id of deletedIds) {
      if (!isUuid(id)) continue
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) console.error('SupabaseJobRepository.save delete error:', error.message)
    }

    for (const job of rows) {
      const record = toProjectRecord(job, branchEnum)
      if (isUuid(job.id)) {
        const { error } = await supabase
          .from('projects')
          .update({ ...record, updated_at: new Date().toISOString() })
          .eq('id', job.id)
        if (error) console.error('SupabaseJobRepository.save update error:', error.message)
      } else {
        const { error } = await supabase.from('projects').insert({ id: randomUUID(), ...record })
        if (error) console.error('SupabaseJobRepository.save insert error:', error.message)
      }
    }

    return this.list(branch, payload.filters)
  }

  async delete(id) {
    const supabase = getSupabase()
    if (!supabase || !isUuid(id)) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) console.error('SupabaseJobRepository.delete error:', error.message)
  }
}
