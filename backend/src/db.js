const fs = require('fs')
const path = require('path')

const DB_CLIENT = (process.env.DB_CLIENT || '').toLowerCase()

if (DB_CLIENT === 'postgres' || (process.env.DATABASE_URL || '').startsWith('postgres')) {
  const { Pool } = require('pg')
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bizchat'
  const pool = new Pool({ connectionString: DATABASE_URL })

  async function init() {
    const sql = `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      sender TEXT,
      ts BIGINT NOT NULL,
      wa_id TEXT,
      direction TEXT,
      type TEXT,
      media_url TEXT,
      status TEXT
    );
    `
    await pool.query(sql)
    // accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        email TEXT,
        role TEXT DEFAULT 'admin'
      );
    `)
    // whatsapp accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_accounts (
        id SERIAL PRIMARY KEY,
        phone_id TEXT,
        token TEXT,
        api_version TEXT
      );
    `)
  }

  async function getMessages() {
    const res = await pool.query('SELECT id, text, sender, ts, wa_id, direction, type, media_url FROM messages ORDER BY ts ASC')
    return res.rows
  }

  async function addMessage(message) {
    const { id, text, sender, ts, wa_id, direction, type, media_url, status } = message
    const sql = 'INSERT INTO messages(id, text, sender, ts, wa_id, direction, type, media_url, status) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)'
    await pool.query(sql, [id, text, sender, ts, wa_id || null, direction || null, type || null, media_url || null, status || null])
    return message
  }

  async function updateMessageStatus(id, status) {
    const sql = 'UPDATE messages SET status = $1 WHERE id = $2'
    await pool.query(sql, [status, id])
  }

  async function getAdminCount() {
    const res = await pool.query('SELECT COUNT(*)::int AS cnt FROM accounts')
    return res.rows[0] && res.rows[0].cnt
  }

  async function createAdmin({ username, password_hash, name, email }) {
    const sql = 'INSERT INTO accounts(username, password_hash, name, email, role) VALUES($1,$2,$3,$4,$5)'
    await pool.query(sql, [username, password_hash, name || null, email || null, 'admin'])
  }

  async function saveWhatsAppAccount({ phone_id, token, api_version }) {
    await pool.query('DELETE FROM whatsapp_accounts')
    const sql = 'INSERT INTO whatsapp_accounts(phone_id, token, api_version) VALUES($1,$2,$3)'
    await pool.query(sql, [phone_id || null, token || null, api_version || null])
  }

  async function getWhatsAppAccount() {
    const res = await pool.query('SELECT phone_id, token, api_version FROM whatsapp_accounts LIMIT 1')
    return res.rows[0]
  }

  module.exports = { init, getMessages, addMessage, updateMessageStatus, getAdminCount, createAdmin, saveWhatsAppAccount, getWhatsAppAccount, pool }

  module.exports = { init, getMessages, addMessage, updateMessageStatus, pool }

} else {
  // Default to sqlite
  const sqlite3 = require('sqlite3')
  const dbPath = (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:'))
    ? process.env.DATABASE_URL.replace(/^sqlite:/, '')
    : path.join(process.cwd(), 'data', 'bizchat.sqlite')

  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const db = new sqlite3.Database(dbPath)

  function run(sql, params=[]) {
    return new Promise((resolve, reject) => db.run(sql, params, function(err) {
      if (err) reject(err); else resolve(this)
    }))
  }

  function all(sql, params=[]) {
    return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)))
  }

  async function init() {
    const sql = `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      sender TEXT,
      ts BIGINT NOT NULL,
      wa_id TEXT,
      direction TEXT,
      type TEXT,
      media_url TEXT,
      status TEXT
    );
    `
    await run(sql)
    // accounts table
    await run(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        email TEXT,
        role TEXT DEFAULT 'admin'
      );
    `)
    await run(`
      CREATE TABLE IF NOT EXISTS whatsapp_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_id TEXT,
        token TEXT,
        api_version TEXT
      );
    `)
  }

  async function getMessages() {
    const rows = await all('SELECT id, text, sender, ts, wa_id, direction, type, media_url FROM messages ORDER BY ts ASC')
    return rows
  }

  async function addMessage(message) {
    const { id, text, sender, ts, wa_id, direction, type, media_url, status } = message
    const sql = 'INSERT OR REPLACE INTO messages(id, text, sender, ts, wa_id, direction, type, media_url, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)'
    await run(sql, [id, text, sender, ts, wa_id || null, direction || null, type || null, media_url || null, status || null])
    return message
  }

  async function updateMessageStatus(id, status) {
    const sql = 'UPDATE messages SET status = ? WHERE id = ?'
    await run(sql, [status, id])
  }

  async function getAdminCount() {
    const rows = await all('SELECT COUNT(*) as cnt FROM accounts')
    return rows && rows[0] && rows[0].cnt
  }

  async function createAdmin({ username, password_hash, name, email }) {
    const sql = 'INSERT INTO accounts(username, password_hash, name, email, role) VALUES(?, ?, ?, ?, ?)'
    await run(sql, [username, password_hash, name || null, email || null, 'admin'])
  }

  async function saveWhatsAppAccount({ phone_id, token, api_version }) {
    await run('DELETE FROM whatsapp_accounts')
    const sql = 'INSERT INTO whatsapp_accounts(phone_id, token, api_version) VALUES(?, ?, ?)'
    await run(sql, [phone_id || null, token || null, api_version || null])
  }

  async function getWhatsAppAccount() {
    const rows = await all('SELECT phone_id as phoneId, token, api_version as apiVersion FROM whatsapp_accounts LIMIT 1')
    return rows && rows[0]
  }

  module.exports = { init, getMessages, addMessage, updateMessageStatus, getAdminCount, createAdmin, saveWhatsAppAccount, getWhatsAppAccount, db }

  module.exports = { init, getMessages, addMessage, updateMessageStatus, db }
}
