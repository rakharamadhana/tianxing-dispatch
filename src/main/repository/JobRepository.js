/**
 * JobRepository — storage contract for dispatch jobs.
 *
 * This is the single seam between the app and its data backend.
 * Today it is implemented by SqliteJobRepository (local file).
 * Later, SupabaseJobRepository will implement the SAME methods against
 * the cloud, and only the wiring in ipc.js changes — no renderer edits.
 *
 * All methods are async on purpose: better-sqlite3 is synchronous, but
 * Supabase's client is async, so keeping the signatures async now means
 * the swap requires zero changes to callers or UI.
 *
 * @typedef {Object} Job
 * @property {string}  id                serialized string id (future-proof for UUIDs)
 * @property {string}  branch            '台北' | '新竹' | '高雄'
 * @property {string}  job_date          'YYYYMMDD'
 * @property {string}  job_time          'HH:MM'
 * @property {string}  customer_name
 * @property {string}  phone
 * @property {string}  move_in_address
 * @property {string}  move_out_address
 * @property {number}  unit_price
 * @property {string}  tax_status        '含稅' | '未稅'
 * @property {number}  quantity
 * @property {number}  total_price        unit_price * quantity (recomputed on save)
 * @property {string}  payment_method    '現金' | '月結'
 * @property {string}  payment_status    '已付款' | '未付款'
 * @property {string}  note
 *
 * @typedef {Object} ListFilters
 * @property {string} [dateQuery]     substring match on job_date
 * @property {string} [phoneQuery]    substring match on phone
 * @property {string} [taxFilter]     '含稅' | '未稅' | ''
 * @property {string} [paymentMethod] '現金' | '月結' | ''
 * @property {string} [paymentStatus] '已付款' | '未付款' | ''
 *
 * @typedef {Object} SavePayload
 * @property {Job[]}    rows        full set of rows for the branch (upserted)
 * @property {string[]} deletedIds  ids removed since load
 */

export class JobRepository {
  /**
   * @param {string} branch
   * @param {ListFilters} [filters]
   * @returns {Promise<Job[]>}
   */
  async list(branch, filters = {}) {
    throw new Error('not implemented')
  }

  /**
   * Upsert the given rows and delete removed ids, atomically.
   * @param {string} branch
   * @param {SavePayload} payload
   * @returns {Promise<Job[]>} the reloaded, persisted rows
   */
  async save(branch, payload) {
    throw new Error('not implemented')
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('not implemented')
  }
}
