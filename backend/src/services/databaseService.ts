// Database abstraction layer - wraps both SQLite and PostgreSQL
import { config } from '../config/environment'
import type { Pool } from 'pg'

interface Message {
  id: string
  text: string
  sender?: string
  ts: number
  wa_id?: string
  direction?: string
  type?: string
  media_url?: string
  status?: string
}

interface Contact {
  wa_id: string
  name?: string
  phone?: string
  email?: string
}

interface Assignment {
  message_id: string
  agent_id: number
}

interface Admin {
  username: string
  password_hash: string
  name?: string | null
  email?: string | null
}

interface WhatsAppAccount {
  phone_id?: string | null
  token?: string | null
  api_version?: string | null
}

interface DatabaseService {
  // Messages
  getMessages(): Promise<Message[]>
  addMessage(message: Message): Promise<Message>
  updateMessageStatus(id: string, status: string): Promise<void>
  getMessagesBetween(tsFrom?: number, tsTo?: number): Promise<Message[]>
  getMessagesCount(tsFrom?: number, tsTo?: number): Promise<number>

  // Contacts
  addContact(contact: Contact): Promise<Contact>
  getContacts(): Promise<Contact[]>
  getContactByWaId(wa_id: string): Promise<Contact | undefined>

  // Assignments
  assignAgent(assignment: Assignment): Promise<any>
  getAssignmentsByAgent(agent_id: number): Promise<any[]>
  getAssignmentsByMessage(message_id: string): Promise<any[]>

  // Admin & Setup
  getAdminCount(): Promise<number>
  createAdmin(admin: Admin): Promise<void>
  getWhatsAppAccount(): Promise<WhatsAppAccount | undefined>
  getWhatsAppAccountByPhoneId(phone_id: string): Promise<WhatsAppAccount | undefined>
  getAllWhatsAppAccounts(): Promise<WhatsAppAccount[]>
  saveWhatsAppAccount(account: WhatsAppAccount): Promise<void>
}

let db: DatabaseService

if (config.db.client === 'postgres') {
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: config.db.postgres.connectionString })

  db = {
    // Messages
    getMessages: async () => {
      const res = await pool.query(
        'SELECT id, text, sender, ts, wa_id, direction, type, media_url FROM messages ORDER BY ts ASC'
      )
      return res.rows
    },

    addMessage: async (message: Message) => {
      const { id, text, sender, ts, wa_id, direction, type, media_url, status } = message
      await pool.query(
        'INSERT INTO messages(id, text, sender, ts, wa_id, direction, type, media_url, status) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, text, sender, ts, wa_id || null, direction || null, type || null, media_url || null, status || null]
      )
      return message
    },

    updateMessageStatus: async (id: string, status: string) => {
      await pool.query('UPDATE messages SET status = $1 WHERE id = $2', [status, id])
    },

    getMessagesBetween: async (tsFrom?: number, tsTo?: number) => {
      let sql = 'SELECT id, text, sender, ts, wa_id, direction, type, media_url, status FROM messages'
      const params: any[] = []
      if (tsFrom || tsTo) {
        const where = []
        if (tsFrom) {
          params.push(tsFrom)
          where.push(`ts >= $${params.length}`)
        }
        if (tsTo) {
          params.push(tsTo)
          where.push(`ts <= $${params.length}`)
        }
        sql += ' WHERE ' + where.join(' AND ')
      }
      sql += ' ORDER BY ts ASC'
      const res = await pool.query(sql, params)
      return res.rows
    },

    getMessagesCount: async (tsFrom?: number, tsTo?: number) => {
      let sql = 'SELECT COUNT(*)::int AS cnt FROM messages'
      const params: any[] = []
      if (tsFrom || tsTo) {
        const where = []
        if (tsFrom) {
          params.push(tsFrom)
          where.push(`ts >= $${params.length}`)
        }
        if (tsTo) {
          params.push(tsTo)
          where.push(`ts <= $${params.length}`)
        }
        sql += ' WHERE ' + where.join(' AND ')
      }
      const res = await pool.query(sql, params)
      return res.rows[0] && res.rows[0].cnt ? res.rows[0].cnt : 0
    },

    // Contacts
    addContact: async (contact: Contact) => {
      const { wa_id, name, phone, email } = contact
      const sql =
        'INSERT INTO contacts(wa_id, name, phone, email) VALUES($1, $2, $3, $4) ON CONFLICT (wa_id) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, email=EXCLUDED.email RETURNING *'
      const res = await pool.query(sql, [wa_id, name, phone, email])
      return res.rows[0]
    },

    getContacts: async () => {
      const res = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC')
      return res.rows
    },

    getContactByWaId: async (wa_id: string) => {
      const res = await pool.query('SELECT * FROM contacts WHERE wa_id = $1', [wa_id])
      return res.rows[0]
    },

    // Assignments
    assignAgent: async (assignment: Assignment) => {
      const { message_id, agent_id } = assignment
      const sql = 'INSERT INTO agent_assignments(message_id, agent_id) VALUES($1, $2) RETURNING *'
      const res = await pool.query(sql, [message_id, agent_id])
      return res.rows[0]
    },

    getAssignmentsByAgent: async (agent_id: number) => {
      const res = await pool.query('SELECT * FROM agent_assignments WHERE agent_id = $1', [agent_id])
      return res.rows
    },

    getAssignmentsByMessage: async (message_id: string) => {
      const res = await pool.query('SELECT * FROM agent_assignments WHERE message_id = $1', [message_id])
      return res.rows
    },

    // Admin & Setup
    getAdminCount: async () => {
      const res = await pool.query('SELECT COUNT(*)::int AS cnt FROM accounts')
      return res.rows[0] && res.rows[0].cnt ? res.rows[0].cnt : 0
    },

    createAdmin: async (admin: Admin) => {
      const { username, password_hash, name, email } = admin
      const sql = 'INSERT INTO accounts(username, password_hash, name, email, role) VALUES($1,$2,$3,$4,$5)'
      await pool.query(sql, [username, password_hash, name || null, email || null, 'admin'])
    },

    getWhatsAppAccount: async () => {
      const res = await pool.query('SELECT phone_id, token, api_version FROM whatsapp_accounts LIMIT 1')
      return res.rows[0]
    },
    getWhatsAppAccountByPhoneId: async (phone_id: string) => {
      const res = await pool.query('SELECT phone_id, token, api_version FROM whatsapp_accounts WHERE phone_id = $1 LIMIT 1', [phone_id])
      return res.rows[0]
    },

    getAllWhatsAppAccounts: async () => {
      const res = await pool.query('SELECT phone_id, token, api_version FROM whatsapp_accounts ORDER BY phone_id')
      return res.rows
    },

    saveWhatsAppAccount: async (account: WhatsAppAccount) => {
      const { phone_id, token, api_version } = account
      // Upsert by phone_id
      const sql = `INSERT INTO whatsapp_accounts(phone_id, token, api_version) VALUES($1,$2,$3)
        ON CONFLICT (phone_id) DO UPDATE SET token = EXCLUDED.token, api_version = EXCLUDED.api_version`
      await pool.query(sql, [phone_id || null, token || null, api_version || null])
    },
  }
} else {
  // SQLite implementation
  const sqlite3 = require('sqlite3')
  const fs = require('fs')
  const path = require('path')

  const dir = path.dirname(config.db.sqlite.path)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const database = new sqlite3.Database(config.db.sqlite.path)

  function run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) =>
      database.run(sql, params, function (err: Error | null) {
        if (err) reject(err)
        else resolve(this)
      })
    )
  }

  function all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) =>
      database.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    )
  }

  db = {
    // Messages
    getMessages: async () => {
      return all('SELECT id, text, sender, ts, wa_id, direction, type, media_url FROM messages ORDER BY ts ASC')
    },

    addMessage: async (message: Message) => {
      const { id, text, sender, ts, wa_id, direction, type, media_url, status } = message
      const sql =
        'INSERT OR REPLACE INTO messages(id, text, sender, ts, wa_id, direction, type, media_url, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)'
      await run(sql, [id, text, sender, ts, wa_id || null, direction || null, type || null, media_url || null, status || null])
      return message
    },

    updateMessageStatus: async (id: string, status: string) => {
      await run('UPDATE messages SET status = ? WHERE id = ?', [status, id])
    },

    getMessagesBetween: async (tsFrom?: number, tsTo?: number) => {
      let sql = 'SELECT id, text, sender, ts, wa_id, direction, type, media_url, status FROM messages'
      const params: any[] = []
      if (tsFrom || tsTo) {
        const where = []
        if (tsFrom) {
          params.push(tsFrom)
          where.push('ts >= ?')
        }
        if (tsTo) {
          params.push(tsTo)
          where.push('ts <= ?')
        }
        sql += ' WHERE ' + where.join(' AND ')
      }
      sql += ' ORDER BY ts ASC'
      return all(sql, params)
    },

    getMessagesCount: async (tsFrom?: number, tsTo?: number) => {
      let sql = 'SELECT COUNT(*) as cnt FROM messages'
      const params: any[] = []
      if (tsFrom || tsTo) {
        const where = []
        if (tsFrom) {
          params.push(tsFrom)
          where.push('ts >= ?')
        }
        if (tsTo) {
          params.push(tsTo)
          where.push('ts <= ?')
        }
        sql += ' WHERE ' + where.join(' AND ')
      }
      const rows = await all(sql, params)
      return rows && rows[0] && rows[0].cnt ? rows[0].cnt : 0
    },

    // Contacts
    addContact: async (contact: Contact) => {
      const { wa_id, name, phone, email } = contact
      const sql =
        'INSERT INTO contacts(wa_id, name, phone, email) VALUES(?, ?, ?, ?) ON CONFLICT(wa_id) DO UPDATE SET name=excluded.name, phone=excluded.phone, email=excluded.email'
      await run(sql, [wa_id, name, phone, email])
      return await db.getContactByWaId(wa_id)
    },

    getContacts: async () => {
      return all('SELECT * FROM contacts ORDER BY created_at DESC')
    },

    getContactByWaId: async (wa_id: string) => {
      const rows = await all('SELECT * FROM contacts WHERE wa_id = ?', [wa_id])
      return rows && rows[0]
    },

    // Assignments
    assignAgent: async (assignment: Assignment) => {
      const { message_id, agent_id } = assignment
      const sql = 'INSERT INTO agent_assignments(message_id, agent_id) VALUES(?, ?)'
      await run(sql, [message_id, agent_id])
      return await db.getAssignmentsByMessage(message_id)
    },

    getAssignmentsByAgent: async (agent_id: number) => {
      return all('SELECT * FROM agent_assignments WHERE agent_id = ?', [agent_id])
    },

    getAssignmentsByMessage: async (message_id: string) => {
      return all('SELECT * FROM agent_assignments WHERE message_id = ?', [message_id])
    },

    // Admin & Setup
    getAdminCount: async () => {
      const rows = await all('SELECT COUNT(*) as cnt FROM accounts')
      return rows && rows[0] && rows[0].cnt ? rows[0].cnt : 0
    },

    createAdmin: async (admin: Admin) => {
      const { username, password_hash, name, email } = admin
      const sql = 'INSERT INTO accounts(username, password_hash, name, email, role) VALUES(?, ?, ?, ?, ?)'
      await run(sql, [username, password_hash, name || null, email || null, 'admin'])
    },

    getWhatsAppAccount: async () => {
      const rows = await all('SELECT phone_id, token, api_version FROM whatsapp_accounts LIMIT 1')
      return rows && rows[0]
    },

    getWhatsAppAccountByPhoneId: async (phone_id: string) => {
      const rows = await all('SELECT phone_id, token, api_version FROM whatsapp_accounts WHERE phone_id = ? LIMIT 1', [phone_id])
      return rows && rows[0]
    },

    getAllWhatsAppAccounts: async () => {
      return all('SELECT phone_id, token, api_version FROM whatsapp_accounts ORDER BY phone_id')
    },

    saveWhatsAppAccount: async (account: WhatsAppAccount) => {
      const { phone_id, token, api_version } = account
      // Insert or replace by phone_id
      const sql = 'INSERT OR REPLACE INTO whatsapp_accounts(phone_id, token, api_version) VALUES(?, ?, ?)'
      await run(sql, [phone_id || null, token || null, api_version || null])
    },
  }
}

export default db
