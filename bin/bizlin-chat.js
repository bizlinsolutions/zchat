#!/usr/bin/env node
const { spawn } = require('child_process')

function start(name, cmd, args) {
  const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true })
  p.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`))
  p.stderr.on('data', d => process.stderr.write(`[${name}] ${d}`))
  p.on('exit', (code, sig) => console.log(`${name} exited (${sig || code})`))
  return p
}

console.log('Starting bizlin-chat: backend and frontend')

const procs = []

// Start backend (npm start in backend)
procs.push(start('backend', 'npm', ['--prefix', 'backend', 'run', 'start']))

// Start frontend in dev mode (Next.js dev server)
procs.push(start('frontend', 'npm', ['--prefix', 'frontend', 'run', 'dev']))

function shutdown() {
  console.log('Shutting down...')
  procs.forEach(p => {
    try { p.kill('SIGTERM') } catch (e) {}
  })
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
