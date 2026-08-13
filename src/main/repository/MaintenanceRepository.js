/**
 * MaintenanceRepository — storage contract for vehicle maintenance records.
 *
 * Mirrors JobRepository's shape so a future SupabaseMaintenanceRepository
 * can drop in without renderer changes. See src/main/repository/JobRepository.js.
 *
 * @typedef {Object} MaintenanceRecord
 * @property {string} id                serialized string id
 * @property {string} branch            '台北' | '新竹' | '高雄'
 * @property {string} record_datetime   free-form date/time text
 * @property {string} driver_name
 * @property {number} amount
 * @property {string} description
 *
 * @typedef {Object} SavePayload
 * @property {MaintenanceRecord[]} rows        full set of rows for the branch (upserted)
 * @property {string[]}            deletedIds  ids removed since load
 */

export class MaintenanceRepository {
  /**
   * @param {string} branch
   * @returns {Promise<MaintenanceRecord[]>}
   */
  async list(branch) {
    throw new Error('not implemented')
  }

  /**
   * Upsert the given rows and delete removed ids, atomically.
   * @param {string} branch
   * @param {SavePayload} payload
   * @returns {Promise<MaintenanceRecord[]>} the reloaded, persisted rows
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
