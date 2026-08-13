import { ipcMain } from 'electron'
import { SqliteJobRepository } from './repository/SqliteJobRepository.js'
import { SqliteMaintenanceRepository } from './repository/SqliteMaintenanceRepository.js'

/**
 * Wires IPC channels to the active job/maintenance repositories.
 *
 * To switch to Supabase later: replace the lines below with
 *   const repo = new SupabaseJobRepository(config)
 * and nothing else in the app needs to change.
 */
const repo = new SqliteJobRepository()
const maintenanceRepo = new SqliteMaintenanceRepository()

export function registerIpc() {
  ipcMain.handle('jobs:list', (_e, branch, filters) => repo.list(branch, filters))
  ipcMain.handle('jobs:save', (_e, branch, payload) => repo.save(branch, payload))
  ipcMain.handle('jobs:delete', (_e, id) => repo.delete(id))

  ipcMain.handle('maintenance:list', (_e, branch) => maintenanceRepo.list(branch))
  ipcMain.handle('maintenance:save', (_e, branch, payload) => maintenanceRepo.save(branch, payload))
  ipcMain.handle('maintenance:delete', (_e, id) => maintenanceRepo.delete(id))
}
