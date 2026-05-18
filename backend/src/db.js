const { Pool } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bizchat'

const pool = new Pool({ connectionString: DATABASE_URL })

async function init() {
  // Create messages table if it doesn't exist
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

module.exports = { init, getMessages, addMessage, updateMessageStatus, pool }

module.exports = { init, getMessages, addMessage, pool }
