import { ipcMain } from 'electron'
import { SqliteJobRepository } from './repository/SqliteJobRepository.js'

/**
 * Wires IPC channels to the active job repository.
 *
 * To switch to Supabase later: replace the line below with
 *   const repo = new SupabaseJobRepository(config)
 * and nothing else in the app needs to change.
 */
const repo = new SqliteJobRepository()

export function registerIpc() {
  ipcMain.handle('jobs:list', (_e, branch, filters) => repo.list(branch, filters))
  ipcMain.handle('jobs:save', (_e, branch, payload) => repo.save(branch, payload))
  ipcMain.handle('jobs:delete', (_e, id) => repo.delete(id))
}
