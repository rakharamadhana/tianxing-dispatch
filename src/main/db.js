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
      project_type    TEXT    NOT NULL DEFAULT '搬工',
      job_date        TEXT    DEFAULT '',
      job_time        TEXT    DEFAULT '',
      customer_name   TEXT    DEFAULT '',
      phone           TEXT    DEFAULT '',
      move_in_address TEXT    DEFAULT '',
      move_out_address TEXT   DEFAULT '',
      unit_price      INTEGER DEFAULT 0,
      tax_status      TEXT    DEFAULT '未稅',
      quantity        INTEGER DEFAULT 1,
      worker_count    INTEGER DEFAULT 0,
      total_price     INTEGER DEFAULT 0,
      payment_method  TEXT    DEFAULT '現金',
      payment_status  TEXT    DEFAULT '未付款',
      note            TEXT    DEFAULT '',
      materials       TEXT    DEFAULT '[]',
      sort_order      INTEGER DEFAULT 0,
      created_at      TEXT    DEFAULT '',
      updated_at      TEXT    DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_branch ON jobs(branch);

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      branch          TEXT    NOT NULL,
      record_datetime TEXT    DEFAULT '',
      driver_name     TEXT    DEFAULT '',
      amount          INTEGER DEFAULT 0,
      description     TEXT    DEFAULT '',
      sort_order      INTEGER DEFAULT 0,
      created_at      TEXT    DEFAULT '',
      updated_at      TEXT    DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_maintenance_branch ON maintenance_records(branch);
  `)

  migrateSchema(db)
  seedIfEmpty(db)
  seedMaintenanceIfEmpty(db)
  return db
}

/** Add columns introduced after the initial release to any pre-existing DB file. */
function migrateSchema(database) {
  const existing = new Set(database.prepare('PRAGMA table_info(jobs)').all().map((c) => c.name))
  const additions = [
    ['project_type', "TEXT NOT NULL DEFAULT '搬工'"],
    ['worker_count', 'INTEGER DEFAULT 0'],
    ['materials', "TEXT DEFAULT '[]'"]
  ]
  for (const [name, definition] of additions) {
    if (!existing.has(name)) {
      database.exec(`ALTER TABLE jobs ADD COLUMN ${name} ${definition}`)
    }
  }
}

/** Seed a few sample rows (matching the screenshot) on first run only. */
function seedIfEmpty(database) {
  const count = database.prepare('SELECT COUNT(*) AS c FROM jobs').get().c
  if (count > 0) return

  const now = new Date().toISOString()
  const insert = database.prepare(`
    INSERT INTO jobs (
      branch, project_type, job_date, job_time, customer_name, phone,
      move_in_address, move_out_address, unit_price, tax_status,
      quantity, worker_count, total_price, payment_method, payment_status, note,
      materials, sort_order, created_at, updated_at
    ) VALUES (
      @branch, @project_type, @job_date, @job_time, @customer_name, @phone,
      @move_in_address, @move_out_address, @unit_price, @tax_status,
      @quantity, @worker_count, @total_price, @payment_method, @payment_status, @note,
      @materials, @sort_order, @created_at, @updated_at
    )
  `)

  const samples = [
    {
      branch: '高雄', project_type: '搬工', job_date: '20260723', job_time: '10:00',
      customer_name: '李小姐', phone: '0982115727',
      move_in_address: '鳳山文享街46號4樓', move_out_address: '鳳山',
      unit_price: 4000, tax_status: '含稅', quantity: 1, worker_count: 0, total_price: 4000,
      payment_method: '現金', payment_status: '已付款', note: '', materials: '[]'
    },
    {
      branch: '高雄', project_type: '搬工', job_date: '20260801', job_time: '10:00',
      customer_name: '黃小姐', phone: '0976503201',
      move_in_address: '仁武仁孝路407巷56號9樓', move_out_address: '左營華夏路411號11樓-7',
      unit_price: 3500, tax_status: '未稅', quantity: 1, worker_count: 0, total_price: 3500,
      payment_method: '現金', payment_status: '已付款', note: '', materials: '[]'
    },
    {
      branch: '高雄', project_type: '搬工', job_date: '20260812', job_time: '08:00',
      customer_name: '新特系統 陳', phone: '0922575151',
      move_in_address: '鼓山明華路315號', move_out_address: '燕巢橋科六路11號',
      unit_price: 5000, tax_status: '含稅', quantity: 15, worker_count: 0, total_price: 75000,
      payment_method: '現金', payment_status: '已付款', note: '今日勿接', materials: '[]'
    }
  ]

  const insertMany = database.transaction((rows) => {
    rows.forEach((r, i) => insert.run({ ...r, sort_order: i, created_at: now, updated_at: now }))
  })
  insertMany(samples)
}

/** Seed a few sample maintenance rows on first run only. */
function seedMaintenanceIfEmpty(database) {
  const count = database.prepare('SELECT COUNT(*) AS c FROM maintenance_records').get().c
  if (count > 0) return

  const now = new Date().toISOString()
  const insert = database.prepare(`
    INSERT INTO maintenance_records (
      branch, record_datetime, driver_name, amount, description, sort_order, created_at, updated_at
    ) VALUES (
      @branch, @record_datetime, @driver_name, @amount, @description, @sort_order, @created_at, @updated_at
    )
  `)

  const samples = [
    { branch: '高雄', record_datetime: '2026-01-15 09:30', driver_name: '王志明', amount: 1200, description: '更換機油與機油濾芯' },
    { branch: '高雄', record_datetime: '2026-02-03 14:00', driver_name: '陳建宏', amount: 850, description: '煞車來令片檢查更換' },
    { branch: '高雄', record_datetime: '2026-03-20 10:15', driver_name: '林大山', amount: 3200, description: '輪胎四輪定位與更換' },
    { branch: '高雄', record_datetime: '2026-04-11 16:45', driver_name: '張美玲', amount: 450, description: '雨刷更換' },
    { branch: '高雄', record_datetime: '2026-05-28 11:00', driver_name: '李國強', amount: 2100, description: '冷氣系統保養' }
  ]

  const insertMany = database.transaction((rows) => {
    rows.forEach((r, i) => insert.run({ ...r, sort_order: i, created_at: now, updated_at: now }))
  })
  insertMany(samples)
}
