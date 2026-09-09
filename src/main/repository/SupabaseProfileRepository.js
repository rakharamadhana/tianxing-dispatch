import { getSupabase } from '../supabaseClient.js'
import { labelToEnum, enumToLabel, ALL_LABEL } from '../branchMap.js'

/**
 * Read-only lookups against Supabase's `profiles` table — used to populate
 * the driver picker when a manager creates a fuel/maintenance request on a
 * driver's behalf. RLS already scopes what's visible: a branch manager sees
 * only their branch's profiles, headquarters (CEO) sees all.
 */
export class SupabaseProfileRepository {
  async listDrivers(branch) {
    const supabase = getSupabase()
    if (!supabase) return []
    const branchEnum = labelToEnum(branch)
    if (!branchEnum && branch !== ALL_LABEL) return []

    let query = supabase.from('profiles').select('id, name, email, branch').eq('role', 'driver')
    if (branchEnum && branchEnum !== 'headquarters') query = query.eq('branch', branchEnum)

    const { data, error } = await query.order('name', { ascending: true })
    if (error) {
      console.error('SupabaseProfileRepository.listDrivers error:', error.message)
      return []
    }
    return data.map((p) => ({
      id: p.id,
      name: p.name || p.email || '',
      branch: enumToLabel(p.branch) || ''
    }))
  }

  /**
   * Every worker (driver/manager/assistant) visible under RLS — used to
   * assign named workers + a commission % to a job for payroll purposes.
   * Unlike listDrivers(), not filtered by role.
   */
  async listWorkers(branch) {
    const supabase = getSupabase()
    if (!supabase) return []
    const branchEnum = labelToEnum(branch)
    if (!branchEnum && branch !== ALL_LABEL) return []

    let query = supabase.from('profiles').select('id, name, email, role, branch')
    if (branchEnum && branchEnum !== 'headquarters') query = query.eq('branch', branchEnum)

    const { data, error } = await query.order('name', { ascending: true })
    if (error) {
      console.error('SupabaseProfileRepository.listWorkers error:', error.message)
      return []
    }
    return data.map((p) => ({
      id: p.id,
      name: p.name || p.email || '',
      role: p.role || '',
      branch: enumToLabel(p.branch) || ''
    }))
  }
}
