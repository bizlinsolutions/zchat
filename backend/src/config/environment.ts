import * as path from 'path'
import * as fs from 'fs'

const isProd = process.env.NODE_ENV === 'production'
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000
const dbClient = (process.env.DB_CLIENT || 'sqlite').toLowerCase()
const dbName = process.env.DATABASE_NAME || 'bizlin_chat'

// SQLite database path
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const sqlitePath = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:')
  ? process.env.DATABASE_URL.replace(/^sqlite:/, '')
  : path.join(dataDir, `${dbName}.sqlite`)

// PostgreSQL connection string
const postgresUrl = process.env.DATABASE_URL || `postgresql://postgres:postgres@localhost:5432/${dbName}`

export const config = {
  port,
  isProd,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    client: dbClient as 'sqlite' | 'postgres',
    sqlite: {
      path: sqlitePath,
    },
    postgres: {
      connectionString: postgresUrl,
    },
  },
  whatsapp: {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v25.0',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
}
