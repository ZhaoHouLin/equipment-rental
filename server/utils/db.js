import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

let db

const SCHEMA = `
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  asset_no TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('unit','bulk')),
  qty INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS rentals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dept TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  borrowed_at INTEGER NOT NULL,
  due_at INTEGER NOT NULL,
  returned_at INTEGER,
  status TEXT NOT NULL DEFAULT '借用中',
  signature TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rental_items (
  rental_id INTEGER NOT NULL REFERENCES rentals(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  qty INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status, due_at);
`

const DEFAULT_SETTINGS = {
  org_name: '設備借用系統',
  departments: JSON.stringify(['資訊室', '總務處', '業務部', '人資部', '企劃部']),
  mail_domain: '',
  scan_suffix_len: '4',
}

export function getDb() {
  if (db) return db
  const file = path.resolve(useRuntimeConfig().dbPath)
  mkdirSync(path.dirname(file), { recursive: true })
  db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  db.exec(SCHEMA)
  const ins = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) ins.run(k, v)
  if (useRuntimeConfig().seedDemo && db.prepare('SELECT COUNT(*) c FROM items').get().c === 0) seedDemo(db)
  return db
}

/** 交易：fn 內丟錯就 rollback */
export function tx(fn) {
  const d = getDb()
  d.exec('BEGIN IMMEDIATE')
  try {
    const r = fn(d)
    d.exec('COMMIT')
    return r
  } catch (e) {
    d.exec('ROLLBACK')
    throw e
  }
}

export function audit(actor, action, target = '', detail = '') {
  getDb()
    .prepare('INSERT INTO audit_log (at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)')
    .run(Date.now(), actor, action, String(target), typeof detail === 'string' ? detail : JSON.stringify(detail))
}

export function getSettings() {
  const rows = getDb().prepare('SELECT key, value FROM settings').all()
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    orgName: s.org_name,
    departments: JSON.parse(s.departments || '[]'),
    mailDomain: s.mail_domain || '',
    scanSuffixLen: Number(s.scan_suffix_len) || 4,
  }
}

export function setSettings({ orgName, departments, mailDomain, scanSuffixLen }) {
  const up = getDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
  if (orgName != null) up.run('org_name', String(orgName))
  if (Array.isArray(departments)) up.run('departments', JSON.stringify(departments.map(String)))
  if (mailDomain != null) up.run('mail_domain', String(mailDomain))
  if (scanSuffixLen != null) up.run('scan_suffix_len', String(Number(scanSuffixLen) || 4))
}

/** 借用單附品項 */
export function listRentals({ status } = {}) {
  const d = getDb()
  const where = status ? 'WHERE r.status = ?' : ''
  const rentals = d.prepare(`SELECT * FROM rentals r ${where} ORDER BY r.id DESC`).all(...(status ? [status] : []))
  const items = d.prepare(
    'SELECT ri.rental_id, ri.qty, i.id item_id, i.category, i.asset_no, i.name, i.kind FROM rental_items ri JOIN items i ON i.id = ri.item_id'
  ).all()
  const byRental = new Map()
  for (const it of items) {
    if (!byRental.has(it.rental_id)) byRental.set(it.rental_id, [])
    byRental.get(it.rental_id).push(it)
  }
  const now = Date.now()
  return rentals.map((r) => ({
    ...r,
    items: byRental.get(r.id) ?? [],
    overdue: r.status === '借用中' && r.due_at < now,
  }))
}

function seedDemo(d) {
  const ins = d.prepare('INSERT INTO items (category, asset_no, name, kind, qty, total) VALUES (?, ?, ?, ?, ?, ?)')
  for (let i = 1; i <= 5; i++) ins.run('筆電', String(1000 + i), `ThinkPad ${i}`, 'unit', 1, 1)
  for (let i = 1; i <= 3; i++) ins.run('投影機', String(2000 + i), `EPSON ${i}`, 'unit', 1, 1)
  for (let i = 1; i <= 3; i++) ins.run('視訊鏡頭', String(3000 + i), `Logitech ${i}`, 'unit', 1, 1)
  ins.run('配件', '', 'HDMI 轉接頭', 'bulk', 5, 5)
  ins.run('配件', '', 'USB 外接網孔', 'bulk', 3, 3)
  ins.run('配件', '', '延長線', 'bulk', 4, 4)
  d.prepare('INSERT INTO audit_log (at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)').run(Date.now(), 'system', '建立示範資料', '', '')
}
