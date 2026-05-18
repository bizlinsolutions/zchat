#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

function start(name, cmd, args, env) {
  const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true, env })
  // if a log stream is provided in env (LOG_STREAM_<name>) write there
  const logPath = env && env.__LOG_PATH
  if (logPath) {
    const fs = require('fs')
    const s = fs.createWriteStream(logPath, { flags: 'a' })
    p.stdout.on('data', d => s.write(`[${name}] ${d}`))
    p.stderr.on('data', d => s.write(`[${name}][ERR] ${d}`))
  } else {
    p.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`))
    p.stderr.on('data', d => process.stderr.write(`[${name}] ${d}`))
  }
  p.on('exit', (code, sig) => console.log(`${name} exited (${sig || code})`))
  return p
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { port: 1994, db: 'sqlite' }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--port' && args[i+1]) { out.port = parseInt(args[i+1], 10); i++ }
    else if (a === '--db' && args[i+1]) { out.db = args[i+1]; i++ }
    else if (a === '--dbname' && args[i+1]) { out.dbname = args[i+1]; i++ }
    else if (a === '--help' || a === '-h') { out.action = 'help' }
    else out.extra.push(a)
  }
  return out
}

const opts = parseArgs()
const backendPort = opts.port || 1994
const frontendPort = backendPort + 1
const dbType = (opts.db || 'sqlite').toLowerCase()
const action = opts.action
const fs = require('fs')
const pidFile = path.join(process.cwd(), '.bizlin-chat.pid')
const logsDir = path.join(process.cwd(), 'logs')

function usage() {
  console.log('Usage: bizlin-chat [start|stop|restart|logs] [--port <port>] [--db sqlite|postgres] [--dbname <name>]')
}

if (action === 'help') { usage(); process.exit(0) }

// Handle CLI control actions
if (action === 'start') {
  if (fs.existsSync(pidFile)) { console.log('Already running (pid file exists)'); process.exit(0) }
  const spawnArgs = ['run', '--port', String(backendPort), '--db', dbType, '--dbname', opts.dbname]
  const child = spawn(process.execPath, [path.join(__dirname, 'bizlin-chat.js'), ...spawnArgs], { detached: true, stdio: 'ignore', env: process.env })
  child.unref()
  fs.writeFileSync(pidFile, String(child.pid))
  console.log('Started bizlin-chat daemon, pid', child.pid)
  process.exit(0)
}

if (action === 'stop') {
  if (!fs.existsSync(pidFile)) { console.log('Not running (no pid file)'); process.exit(0) }
  try {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10)
    process.kill(pid)
    fs.unlinkSync(pidFile)
    console.log('Stopped bizlin-chat (pid ' + pid + ')')
  } catch (e) {
    console.error('Failed to stop:', e.message)
  }
  process.exit(0)
}

if (action === 'restart') {
  // stop if running
  if (fs.existsSync(pidFile)) {
    try { const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10); process.kill(pid); fs.unlinkSync(pidFile); console.log('Stopped pid', pid) } catch (e) { console.warn('stop failed', e.message) }
  }
  // start
  const spawnArgs = ['run', '--port', String(backendPort), '--db', dbType, '--dbname', opts.dbname]
  const child = spawn(process.execPath, [path.join(__dirname, 'bizlin-chat.js'), ...spawnArgs], { detached: true, stdio: 'ignore', env: process.env })
  child.unref()
  fs.writeFileSync(pidFile, String(child.pid))
  console.log('Restarted bizlin-chat daemon, pid', child.pid)
  process.exit(0)
}

if (action === 'logs') {
  // print last lines of logs
  const backendLog = path.join(logsDir, 'backend.log')
  const frontendLog = path.join(logsDir, 'frontend.log')
  console.log('Backend log:', backendLog)
  console.log('Frontend log:', frontendLog)
  try {
    const tail = (p) => {
      if (!fs.existsSync(p)) { console.log(p + ' not found'); return }
      const data = fs.readFileSync(p, 'utf8').split('\n').slice(-200).join('\n')
      console.log('\n==== ' + p + ' ====' )
      console.log(data)
    }
    tail(backendLog)
    tail(frontendLog)
  } catch (e) { console.error('failed to read logs', e.message) }
  process.exit(0)
}

// if action === 'run' continue to start processes in foreground (daemon child)
const isRunDaemon = (action === 'run')

console.log(`Starting bizlin-chat (port=${backendPort}, db=${dbType})`)

const procs = []

// env for backend
const dbName = opts.dbname || 'bizlin_chat'
const backendEnv = Object.assign({}, process.env, {
  PORT: String(backendPort),
  DB_CLIENT: dbType,
  DATABASE_URL: dbType === 'sqlite' ? `sqlite:${path.join(process.cwd(), 'data', dbName + '.sqlite')}` : (process.env.DATABASE_URL || `postgresql://postgres:postgres@localhost:5432/${dbName}`)
})

// env for frontend (Next.js accepts -p flag; we'll pass it as arg)
const frontendEnv = Object.assign({}, process.env)
frontendEnv.NEXT_PUBLIC_BACKEND_URL = `http://localhost:${backendPort}`

// Ensure data dir exists for sqlite (the backend will also create if needed)
try { require('fs').mkdirSync(path.join(process.cwd(), 'data'), { recursive: true }) } catch (e) {}

// If running as daemon child ('run'), create logs dir and write logs
if (isRunDaemon) {
  try { fs.mkdirSync(logsDir, { recursive: true }) } catch (e) {}
  backendEnv.__LOG_PATH = path.join(logsDir, 'backend.log')
  frontendEnv.__LOG_PATH = path.join(logsDir, 'frontend.log')
}

// Start backend (npm start in backend)
procs.push(start('backend', 'npm', ['--prefix', 'backend', 'run', 'start'], backendEnv))

// Start frontend in dev mode (Next.js dev server) on frontendPort
procs.push(start('frontend', 'npm', ['--prefix', 'frontend', 'run', 'dev', '--', '-p', String(frontendPort)], frontendEnv))

function shutdown() {
  console.log('Shutting down...')
  procs.forEach(p => {
    try { p.kill('SIGTERM') } catch (e) {}
  })
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
