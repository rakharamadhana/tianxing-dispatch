import { getSupabase } from '../supabaseClient.js'
import { labelToEnum, enumToLabel, ALL_LABEL, ALL_BRANCH_ENUMS } from '../branchMap.js'

/**
 * Reads/writes Supabase's `gasoline_requests` table — the same fuel-request
 * data the driver mobile app writes to and reads from. Drivers insert their
 * own rows (enforced by RLS); this app's managers/CEO can read, approve or
 * reject (update), and create a request on a driver's behalf (insert).
 *
 * There is deliberately no delete: RLS grants managers no DELETE policy on
 * this table, so an unwanted request is rejected, not removed.
 */

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function toRow(record) {
  return {
    id: record.id,
    branch: enumToLabel(record.branch) || '',
    driver_id: record.driver_id,
    driver_name: record.driver_name || '',
    reported_amount: Number(record.reported_amount) || 0,
    approved_amount: Number(record.approved_amount) || 0,
    status: record.status || 'pending',
    created_at: record.created_at || '',
    updated_at: record.updated_at || ''
  }
}

export class SupabaseFuelRepository {
  async list(branch) {
    const supabase = getSupabase()
    if (!supabase) return []
    const branchEnum = labelToEnum(branch)
    if (!branchEnum && branch !== ALL_LABEL) return []

    let query = supabase.from('gasoline_requests').select('*')
    query = branchEnum ? query.eq('branch', branchEnum) : query.in('branch', ALL_BRANCH_ENUMS)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('SupabaseFuelRepository.list error:', error.message)
      return []
    }
    return data.map(toRow)
  }

  async save(branch, payload) {
    const supabase = getSupabase()
    const branchEnum = labelToEnum(branch)
    const rows = payload.rows || []
    if (!supabase) return []

    for (const row of rows) {
      if (isUuid(row.id)) {
        const { error } = await supabase
          .from('gasoline_requests')
          .update({
            driver_id: row.driver_id,
            driver_name: row.driver_name || '',
            reported_amount: Number(row.reported_amount) || 0,
            approved_amount: Number(row.approved_amount) || 0,
            status: row.status || 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id)
        if (error) console.error('SupabaseFuelRepository.save update error:', error.message)
      } else if (isUuid(row.driver_id)) {
        // Only insert once a driver has been picked — a driver-less row is
        // still being filled in and would violate the NOT NULL constraint.
        // From the All tab, branchEnum is null, so fall back to the picked
        // driver's own branch (see FuelView#onDriverPicked).
        const insertBranchEnum = branchEnum || labelToEnum(row.branch)
        if (!insertBranchEnum) continue
        const { error } = await supabase.from('gasoline_requests').insert({
          branch: insertBranchEnum,
          driver_id: row.driver_id,
          driver_name: row.driver_name || '',
          reported_amount: Number(row.reported_amount) || 0,
          approved_amount: Number(row.approved_amount) || 0,
          status: row.status || 'pending'
        })
        if (error) console.error('SupabaseFuelRepository.save insert error:', error.message)
      }
    }

    return this.list(branch)
  }
}
