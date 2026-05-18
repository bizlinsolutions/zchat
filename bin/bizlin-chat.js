#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

function start(name, cmd, args, env) {
  const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true, env })
  p.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`))
  p.stderr.on('data', d => process.stderr.write(`[${name}] ${d}`))
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
    else if (a === '--help' || a === '-h') {
      console.log('Usage: bizlin-chat [--port <port>] [--db sqlite|postgres]')
      process.exit(0)
    }
  }
  return out
}

const opts = parseArgs()
const backendPort = opts.port || 1994
const frontendPort = backendPort + 1
const dbType = (opts.db || 'sqlite').toLowerCase()

console.log(`Starting bizlin-chat (port=${backendPort}, db=${dbType})`)

const procs = []

// env for backend
const backendEnv = Object.assign({}, process.env, {
  PORT: String(backendPort),
  DB_CLIENT: dbType,
  DATABASE_URL: dbType === 'sqlite' ? `sqlite:${path.join(process.cwd(), 'data', 'bizchat.sqlite')}` : process.env.DATABASE_URL || ''
})

// env for frontend (Next.js accepts -p flag; we'll pass it as arg)
const frontendEnv = Object.assign({}, process.env)

// Ensure data dir exists for sqlite (the backend will also create if needed)
try { require('fs').mkdirSync(path.join(process.cwd(), 'data'), { recursive: true }) } catch (e) {}

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
