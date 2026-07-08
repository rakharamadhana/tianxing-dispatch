import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'

/**
 * Opens (and lazily initializes) the local SQLite database.
 * Stored in the per-user app data directory so it survives app updates.
 *
 * NOTE: SQLite is the *temporary* backend. All access goes through
 * SqliteJobRepository so this can later be replaced by SupabaseJobRepository
 * without touching the renderer. See src/main/repository/.
 */

let db = null

export function getDb() {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'tianxing.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      branch          TEXT    NOT NULL,
      job_date        TEXT    DEFAULT '',
      job_time        TEXT    DEFAULT '',
      customer_name   TEXT    DEFAULT '',
      phone           TEXT    DEFAULT '',
      move_in_address TEXT    DEFAULT '',
      move_out_address TEXT   DEFAULT '',
      unit_price      INTEGER DEFAULT 0,
      tax_status      TEXT    DEFAULT '未稅',
      quantity        INTEGER DEFAULT 1,
      total_price     INTEGER DEFAULT 0,
      payment_method  TEXT    DEFAULT '現金',
      payment_status  TEXT    DEFAULT '未付款',
      note            TEXT    DEFAULT '',
      sort_order      INTEGER DEFAULT 0,
      created_at      TEXT    DEFAULT '',
      updated_at      TEXT    DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_branch ON jobs(branch);
  `)

  seedIfEmpty(db)
  return db
}

/** Seed a few sample rows (matching the screenshot) on first run only. */
function seedIfEmpty(database) {
  const count = database.prepare('SELECT COUNT(*) AS c FROM jobs').get().c
  if (count > 0) return

  const now = new Date().toISOString()
  const insert = database.prepare(`
    INSERT INTO jobs (
      branch, job_date, job_time, customer_name, phone,
      move_in_address, move_out_address, unit_price, tax_status,
      quantity, total_price, payment_method, payment_status, note,
      sort_order, created_at, updated_at
    ) VALUES (
      @branch, @job_date, @job_time, @customer_name, @phone,
      @move_in_address, @move_out_address, @unit_price, @tax_status,
      @quantity, @total_price, @payment_method, @payment_status, @note,
      @sort_order, @created_at, @updated_at
    )
  `)

  const samples = [
    {
      branch: '高雄', job_date: '20260723', job_time: '10:00',
      customer_name: '李小姐', phone: '0982115727',
      move_in_address: '鳳山文享街46號4樓', move_out_address: '鳳山',
      unit_price: 4000, tax_status: '含稅', quantity: 1, total_price: 4000,
      payment_method: '現金', payment_status: '已付款', note: ''
    },
    {
      branch: '高雄', job_date: '20260801', job_time: '10:00',
      customer_name: '黃小姐', phone: '0976503201',
      move_in_address: '仁武仁孝路407巷56號9樓', move_out_address: '左營華夏路411號11樓-7',
      unit_price: 3500, tax_status: '未稅', quantity: 1, total_price: 3500,
      payment_method: '現金', payment_status: '已付款', note: ''
    },
    {
      branch: '高雄', job_date: '20260812', job_time: '08:00',
      customer_name: '新特系統 陳', phone: '0922575151',
      move_in_address: '鼓山明華路315號', move_out_address: '燕巢橋科六路11號',
      unit_price: 5000, tax_status: '含稅', quantity: 15, total_price: 75000,
      payment_method: '現金', payment_status: '已付款', note: '今日勿接'
    }
  ]

  const insertMany = database.transaction((rows) => {
    rows.forEach((r, i) => insert.run({ ...r, sort_order: i, created_at: now, updated_at: now }))
  })
  insertMany(samples)
}
