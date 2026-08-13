import { MaintenanceRepository } from './MaintenanceRepository.js'
import { getDb } from '../db.js'

const COLUMNS = [
  'branch', 'record_datetime', 'driver_name', 'amount', 'description',
  'sort_order', 'created_at', 'updated_at'
]

/** Convert a DB row to the wire shape (id as string). */
function toRecord(row) {
  return { ...row, id: String(row.id) }
}

export class SqliteMaintenanceRepository extends MaintenanceRepository {
  async list(branch) {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM maintenance_records WHERE branch = ? ORDER BY sort_order ASC, id ASC')
      .all(branch)
    return rows.map(toRecord)
  }

  async save(branch, payload) {
    const db = getDb()
    const now = new Date().toISOString()
    const rows = payload.rows || []
    const deletedIds = payload.deletedIds || []

    const insert = db.prepare(`
      INSERT INTO maintenance_records (${COLUMNS.join(', ')})
      VALUES (${COLUMNS.map((c) => '@' + c).join(', ')})
    `)
    const update = db.prepare(`
      UPDATE maintenance_records SET
        branch=@branch, record_datetime=@record_datetime, driver_name=@driver_name,
        amount=@amount, description=@description, sort_order=@sort_order, updated_at=@updated_at
      WHERE id=@id
    `)
    const remove = db.prepare('DELETE FROM maintenance_records WHERE id = ?')

    const tx = db.transaction(() => {
      for (const id of deletedIds) {
        if (id != null && String(id).length) remove.run(Number(id))
      }
      rows.forEach((r, index) => {
        const record = {
          branch,
          record_datetime: r.record_datetime || '',
          driver_name: r.driver_name || '',
          amount: Number(r.amount) || 0,
          description: r.description || '',
          sort_order: index,
          updated_at: now
        }
        // A row with a numeric existing id gets updated; new/blank ids inserted.
        const existingId = /^\d+$/.test(String(r.id || '')) ? Number(r.id) : null
        if (existingId) {
          update.run({ ...record, id: existingId })
        } else {
          insert.run({ ...record, created_at: now })
        }
      })
    })
    tx()

    return this.list(branch)
  }

  async delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM maintenance_records WHERE id = ?').run(Number(id))
  }
}
