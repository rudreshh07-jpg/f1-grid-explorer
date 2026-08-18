import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { drivers as seedDrivers, teams as seedTeams, circuits as seedCircuits, flags as seedFlags, sessions as seedSessions, rules as seedRules, strategies as seedStrategies, tyres as seedTyres, glossary as seedGlossary } from './data.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = process.env.F1_DB_PATH || path.join(__dirname, 'f1-grid.sqlite')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
export const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; DROP TABLE IF EXISTS media_cache;')

db.exec(`
CREATE TABLE IF NOT EXISTS content (
  type TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (type, id)
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`)

const now = () => new Date().toISOString()
const upsert = db.prepare(`INSERT INTO content(type,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(type,id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`)
const getAllStmt = db.prepare('SELECT id,data FROM content WHERE type=? ORDER BY id')
const getOneStmt = db.prepare('SELECT id,data FROM content WHERE type=? AND id=?')

export function putContent(type, id, data) {
  upsert.run(type, String(id), JSON.stringify(data), now())
  return data
}
export function deleteContent(type, id) {
  db.prepare('DELETE FROM content WHERE type=? AND id=?').run(type, String(id))
}
export function getContent(type) {
  return getAllStmt.all(type).map(r => JSON.parse(r.data))
}
export function getContentById(type, id) {
  const r = getOneStmt.get(type, String(id))
  return r ? JSON.parse(r.data) : null
}

function seedArray(type, rows, idFn = x => x.id || x.slug || x.round || x.name || `${type}-${Math.random()}`) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM content WHERE type=?').get(type).n
  if (Number(count) > 0) return
  const tx = db.prepare('INSERT OR IGNORE INTO content(type,id,data,updated_at) VALUES(?,?,?,?)')
  for (const item of rows) tx.run(type, String(idFn(item)), JSON.stringify(item), now())
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}
export function verifyPassword(password, hash, salt) {
  const derived = scryptSync(password, salt, 64)
  return timingSafeEqual(derived, Buffer.from(hash, 'hex'))
}

export function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const existing = db.prepare('SELECT id FROM users WHERE username=?').get(username)
  if (existing) return

  let password = process.env.ADMIN_PASSWORD
  if (!password) {
    password = randomBytes(18).toString('base64url')
    console.warn(`[security] ADMIN_PASSWORD is not set. A temporary admin password was generated for this first run: ${password}`)
  }
  if (String(password).length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long.')
  }

  const {hash, salt} = hashPassword(password)
  db.prepare('INSERT INTO users(username,password_hash,salt,role,created_at,updated_at) VALUES(?,?,?,?,?,?)')
    .run(username, hash, salt, 'admin', now(), now())
  console.log(`Admin account ready: ${username}. Change the password from the Admin panel after signing in.`)
}

export function findUser(username) {
  return db.prepare('SELECT * FROM users WHERE username=?').get(username)
}
export function updatePassword(username, password) {
  const {hash, salt} = hashPassword(password)
  db.prepare('UPDATE users SET password_hash=?,salt=?,updated_at=? WHERE username=?').run(hash, salt, now(), username)
}

export function seedDatabase({ archive = null, worldChampions = [], constructorChampions = [], history = [], extraGlossary = [] } = {}) {
  seedArray('drivers', seedDrivers)
  seedArray('teams', seedTeams, x => x.id || x.name)
  seedArray('circuits', seedCircuits, x => x.id || x.round)
  seedArray('flags', seedFlags)
  seedArray('sessions', seedSessions)
  seedArray('rules', seedRules)
  seedArray('strategies', seedStrategies)
  seedArray('tyres', seedTyres)
  seedArray('glossary', [...seedGlossary, ...extraGlossary], x => `${x.letter}-${x.term}`)
  seedArray('world-champions', worldChampions, x => x.id || x.name)
  seedArray('constructor-champions', constructorChampions, x => x.id || x.name)
  seedArray('history', history, x => x.id || x.year)
  if (archive) {
    seedArray('archive-drivers', archive.drivers || [], x => x.id)
    seedArray('archive-teams', archive.constructors || archive.teams || [], x => x.id)
    seedArray('archive-circuits', archive.circuits || [], x => x.id)
  }
  ensureAdmin()
}

// Media cache intentionally removed in v4.4: no driver/team/circuit photographs are stored.

