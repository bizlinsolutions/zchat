const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const { v4: uuidv4 } = require('uuid')
const db = require('./db')
const whatsapp = require('./whatsapp')
const crypto = require('crypto')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend' })
})

app.get('/api/messages', async (req, res) => {
  try {
    const rows = await db.getMessages()
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to load messages' })
  }
})

app.post('/api/messages', async (req, res) => {
  try {
    const { text, sender } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })
    const message = { id: uuidv4(), text, sender: sender || 'agent', ts: Date.now() }
    await db.addMessage(message)
    io.emit('message', message)
    res.status(201).json(message)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to save message' })
  }
})

// Send outbound message via WhatsApp Cloud API
app.post('/api/send', async (req, res) => {
  const { to, text } = req.body
  if (!to || !text) return res.status(400).json({ error: 'to and text are required' })
  try {
    const resp = await whatsapp.sendText(to, text)
    const waMessageId = resp && resp.messages && resp.messages[0] && resp.messages[0].id
    const message = { id: waMessageId || uuidv4(), text, sender: 'us', ts: Date.now(), wa_id: to, direction: 'outbound', type: 'text' }
    await db.addMessage(message)
    io.emit('message', message)
    res.status(200).json(message)
  } catch (err) {
    console.error('send failed', err?.response?.data || err.message || err)
    res.status(500).json({ error: 'failed to send message' })
  }
})

// Webhook verification endpoint (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }
  } else {
    res.sendStatus(400)
  }
})

// Webhook receiver (POST)
// Use raw body parsing for webhook to allow signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const raw = req.body
  const sig = req.headers['x-hub-signature-256']
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (appSecret && sig) {
    const hmac = crypto.createHmac('sha256', appSecret).update(raw).digest('hex')
    const expected = `sha256=${hmac}`
    if (sig !== expected) {
      console.warn('Invalid webhook signature')
      return res.sendStatus(403)
    }
  }
  let body
  try {
    body = JSON.parse(raw.toString())
  } catch (err) {
    console.error('invalid json', err)
    return res.sendStatus(400)
  }

  if (body.object === 'whatsapp_business_account') {
    try {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value || {}
          // Incoming messages
          if (value.messages) {
            for (const msg of value.messages) {
              const wa_id = msg.from || (value.contacts && value.contacts[0] && value.contacts[0].wa_id)
              const senderName = (value.contacts && value.contacts[0] && value.contacts[0].profile && value.contacts[0].profile.name) || wa_id
              let text = ''
              let media_url = null
              if (msg.type === 'text') text = msg.text && msg.text.body
              else if (['image', 'audio', 'video', 'document'].includes(msg.type)) {
                const media = msg[msg.type]
                // media.id is present — get downloadable url
                if (media && media.id) {
                  try {
                    const url = await whatsapp.getMediaUrl(media.id)
                    media_url = url
                  } catch (e) {
                    console.warn('failed to fetch media url', e?.message || e)
                  }
                }
              } else if (msg.type === 'interactive') {
                // buttons or list replies
                if (msg.interactive && msg.interactive.type === 'button_reply') {
                  text = msg.interactive.button_reply && msg.interactive.button_reply.title
                } else if (msg.interactive && msg.interactive.type === 'list_reply') {
                  text = msg.interactive.list_reply && msg.interactive.list_reply.title
                }
              } else if (msg.type === 'contacts') {
                text = JSON.stringify(msg.contacts)
              } else if (msg.type === 'location') {
                text = JSON.stringify(msg.location)
              }
              const message = { id: msg.id || uuidv4(), text, sender: senderName, ts: Date.now(), wa_id, direction: 'inbound', type: msg.type, media_url }
              await db.addMessage(message)
              io.emit('message', message)
            }
          }
          // Status updates
          if (value.statuses) {
            for (const st of value.statuses) {
              const msgId = st.id
              const status = st.status
              if (msgId) await db.updateMessageStatus(msgId, status)
            }
          }
        }
      }
      res.sendStatus(200)
    } catch (err) {
      console.error('webhook processing error', err)
      res.sendStatus(500)
    }
  } else {
    res.sendStatus(404)
  }
})

const port = process.env.PORT || 4000
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  console.log('socket connected', socket.id)
  socket.on('disconnect', () => console.log('socket disconnected', socket.id))
})

;(async () => {
  try {
    await db.init()
    server.listen(port, () => console.log(`Backend listening on ${port}`))
  } catch (err) {
    console.error('Failed to initialize database', err)
    process.exit(1)
  }
})()
