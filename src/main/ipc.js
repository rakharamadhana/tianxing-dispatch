import { ipcMain } from 'electron'
import { SqliteJobRepository } from './repository/SqliteJobRepository.js'
import { SupabaseJobRepository } from './repository/SupabaseJobRepository.js'
import { SupabaseFuelRepository } from './repository/SupabaseFuelRepository.js'
import { SupabaseMaintenanceRepository } from './repository/SupabaseMaintenanceRepository.js'
import { SupabaseProfileRepository } from './repository/SupabaseProfileRepository.js'
import { isSupabaseConfigured } from './supabaseClient.js'
import * as auth from './auth.js'

/**
 * Wires IPC channels to the active job/fuel/maintenance repositories.
 *
 * Jobs use Supabase's existing `projects` table when configured (see
 * SupabaseJobRepository for the field mapping and known gaps), falling back
 * to local SQLite otherwise. Fuel and maintenance always read/write
 * Supabase's `gasoline_requests` / `maintenance_requests` tables — the same
 * driver-submitted, approval-workflow data the mobile app uses — so there is
 * no local fallback for those.
 */
const repo = isSupabaseConfigured() ? new SupabaseJobRepository() : new SqliteJobRepository()
const fuelRepo = new SupabaseFuelRepository()
const maintenanceRepo = new SupabaseMaintenanceRepository()
const profileRepo = new SupabaseProfileRepository()

export function registerIpc() {
  ipcMain.handle('jobs:list', (_e, branch, filters) => repo.list(branch, filters))
  ipcMain.handle('jobs:save', (_e, branch, payload) => repo.save(branch, payload))
  ipcMain.handle('jobs:delete', (_e, id) => repo.delete(id))

  ipcMain.handle('fuel:list', (_e, branch) => fuelRepo.list(branch))
  ipcMain.handle('fuel:save', (_e, branch, payload) => fuelRepo.save(branch, payload))

  ipcMain.handle('maintenance:list', (_e, branch) => maintenanceRepo.list(branch))
  ipcMain.handle('maintenance:save', (_e, branch, payload) => maintenanceRepo.save(branch, payload))

  ipcMain.handle('drivers:list', (_e, branch) => profileRepo.listDrivers(branch))
  ipcMain.handle('workers:list', (_e, branch) => profileRepo.listWorkers(branch))

  ipcMain.handle('auth:login', (_e, email, password) => auth.login(email, password))
  ipcMain.handle('auth:logout', () => auth.logout())
  ipcMain.handle('auth:session', () => auth.getSession())
  ipcMain.handle('auth:updateProfile', (_e, newEmail, newPassword, currentPassword) =>
    auth.updateProfile(newEmail, newPassword, currentPassword)
  )
  ipcMain.handle('auth:deleteAccount', () => auth.deleteAccount())
}
