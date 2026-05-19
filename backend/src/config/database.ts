import { config } from './environment'
import { logger } from '../utils/logger'
import * as fs from 'fs'
import * as path from 'path'
import type { Pool } from 'pg'
import type Database from 'better-sqlite3'

interface DatabaseConnection {
  pool?: Pool
  database?: Database.Database
  init: () => Promise<void>
}

let db: DatabaseConnection

// Initialize database based on configuration
if (config.db.client === 'postgres') {
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: config.db.postgres.connectionString })

  db = {
    pool,
    init: initPostgres,
  }
} else {
  // SQLite
  const sqlite3 = require('sqlite3')

  const dir = path.dirname(config.db.sqlite.path)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const database = new sqlite3.Database(config.db.sqlite.path)

  db = {
    database,
    init: initSqlite,
  }
}

async function initPostgres(): Promise<void> {
  logger.info('Initializing PostgreSQL database')
  const queries = [
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      sender TEXT,
      ts BIGINT NOT NULL,
      wa_id TEXT,
      direction TEXT,
      type TEXT,
      media_url TEXT,
      status TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT DEFAULT 'admin'
    )`,
    `CREATE TABLE IF NOT EXISTS whatsapp_accounts (
      id SERIAL PRIMARY KEY,
      phone_id TEXT UNIQUE,
      token TEXT,
      api_version TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      wa_id TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS agent_assignments (
      id SERIAL PRIMARY KEY,
      message_id TEXT NOT NULL,
      agent_id INTEGER NOT NULL,
      assigned_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (agent_id) REFERENCES accounts(id)
    )`,
  ]

  if (!db.pool) throw new Error('Pool not initialized')

  for (const query of queries) {
    try {
      await db.pool.query(query)
    } catch (err) {
      logger.error('Database initialization error', { error: err instanceof Error ? err.message : 'Unknown error' })
      throw err
    }
  }
  logger.info('PostgreSQL database initialized')
}

async function initSqlite(): Promise<void> {
  logger.info('Initializing SQLite database')
  const queries = [
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      sender TEXT,
      ts BIGINT NOT NULL,
      wa_id TEXT,
      direction TEXT,
      type TEXT,
      media_url TEXT,
      status TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT DEFAULT 'admin'
    )`,
    `CREATE TABLE IF NOT EXISTS whatsapp_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_id TEXT UNIQUE,
      token TEXT,
      api_version TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wa_id TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS agent_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      agent_id INTEGER NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (agent_id) REFERENCES accounts(id)
    )`,
  ]

  return new Promise((resolve, reject) => {
    if (!db.database) {
      reject(new Error('Database not initialized'))
      return
    }

    db.database.serialize(() => {
      let completed = 0
      for (const query of queries) {
        db.database!.run(query, (err: Error | null) => {
          if (err) {
            logger.error('Database initialization error', { error: err.message })
            reject(err)
          } else {
            completed++
            if (completed === queries.length) {
              logger.info('SQLite database initialized')
              resolve()
            }
          }
        })
      }
    })
  })
}

export default db
