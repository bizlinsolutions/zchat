import * as fs from 'fs'
import * as path from 'path'

const logsDir = path.join(process.cwd(), 'logs')

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

const levels = {
  ERROR: 'ERROR' as LogLevel,
  WARN: 'WARN' as LogLevel,
  INFO: 'INFO' as LogLevel,
  DEBUG: 'DEBUG' as LogLevel,
}

function formatLog(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` | ${JSON.stringify(data)}` : ''
  return `[${timestamp}] [${level}] ${message}${dataStr}`
}

function writeLog(level: LogLevel, message: string, data?: any): void {
  const logMessage = formatLog(level, message, data)
  console.log(logMessage)

  // Also write to file
  const logFile = path.join(logsDir, 'backend.log')
  try {
    fs.appendFileSync(logFile, logMessage + '\n')
  } catch (err) {
    console.error('Failed to write to log file:', err instanceof Error ? err.message : 'Unknown error')
  }
}

export const logger = {
  error: (message: string, data?: any) => writeLog(levels.ERROR, message, data),
  warn: (message: string, data?: any) => writeLog(levels.WARN, message, data),
  info: (message: string, data?: any) => writeLog(levels.INFO, message, data),
  debug: (message: string, data?: any) => writeLog(levels.DEBUG, message, data),
}
