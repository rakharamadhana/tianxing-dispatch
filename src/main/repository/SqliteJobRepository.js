import { JobRepository } from './JobRepository.js'
import { getDb } from '../db.js'

const COLUMNS = [
  'branch', 'job_date', 'job_time', 'customer_name', 'phone',
  'move_in_address', 'move_out_address', 'unit_price', 'tax_status',
  'quantity', 'total_price', 'payment_method', 'payment_status', 'note',
  'sort_order', 'created_at', 'updated_at'
]

/** Convert a DB row to the wire shape (id as string). */
function toJob(row) {
  return { ...row, id: String(row.id) }
}

export class SqliteJobRepository extends JobRepository {
  async list(branch, filters = {}) {
    console.log('MAIN PROCESS RECEIVED FILTERS:', JSON.stringify(filters))
    const db = getDb()
    const where = ['branch = @branch']
    const params = { branch }

    if (filters.year) {
      where.push('job_date LIKE @yearQuery')
      params.yearQuery = `${filters.year}%`
    }
    if (filters.dateQuery) {
      where.push('job_date LIKE @dateQuery')
      params.dateQuery = `%${filters.dateQuery}%`
    }
    if (filters.phoneQuery) {
      where.push('phone LIKE @phoneQuery')
      params.phoneQuery = `%${filters.phoneQuery}%`
    }
    if (filters.taxFilter) {
      where.push('tax_status = @taxFilter')
      params.taxFilter = filters.taxFilter
    }
    if (filters.paymentMethod) {
      where.push('payment_method = @paymentMethod')
      params.paymentMethod = filters.paymentMethod
    }
    if (filters.paymentStatus) {
      where.push('payment_status = @paymentStatus')
      params.paymentStatus = filters.paymentStatus
    }

    const sql = `SELECT * FROM jobs WHERE ${where.join(' AND ')} ORDER BY sort_order ASC, id ASC`
    console.log('MAIN PROCESS RUNNING SQL:', sql, 'WITH PARAMS:', JSON.stringify(params))
    const rows = db.prepare(sql).all(params)
    return rows.map(toJob)
  }

  async save(branch, payload) {
    const db = getDb()
    const now = new Date().toISOString()
    const rows = payload.rows || []
    const deletedIds = payload.deletedIds || []

    const insert = db.prepare(`
      INSERT INTO jobs (${COLUMNS.join(', ')})
      VALUES (${COLUMNS.map((c) => '@' + c).join(', ')})
    `)
    const update = db.prepare(`
      UPDATE jobs SET
        branch=@branch, job_date=@job_date, job_time=@job_time,
        customer_name=@customer_name, phone=@phone,
        move_in_address=@move_in_address, move_out_address=@move_out_address,
        unit_price=@unit_price, tax_status=@tax_status, quantity=@quantity,
        total_price=@total_price, payment_method=@payment_method,
        payment_status=@payment_status, note=@note, sort_order=@sort_order,
        updated_at=@updated_at
      WHERE id=@id
    `)
    const remove = db.prepare('DELETE FROM jobs WHERE id = ?')

    const tx = db.transaction(() => {
      for (const id of deletedIds) {
        if (id != null && String(id).length) remove.run(Number(id))
      }
      rows.forEach((r, index) => {
        const unitPrice = Number(r.unit_price) || 0
        const quantity = Number(r.quantity) || 0
        const record = {
          branch,
          job_date: r.job_date || '',
          job_time: r.job_time || '',
          customer_name: r.customer_name || '',
          phone: r.phone || '',
          move_in_address: r.move_in_address || '',
          move_out_address: r.move_out_address || '',
          unit_price: unitPrice,
          tax_status: r.tax_status || '未稅',
          quantity,
          total_price: unitPrice * quantity,
          payment_method: r.payment_method || '現金',
          payment_status: r.payment_status || '未付款',
          note: r.note || '',
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

    return this.list(branch, payload.filters)
  }

  async delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM jobs WHERE id = ?').run(Number(id))
  }
}
