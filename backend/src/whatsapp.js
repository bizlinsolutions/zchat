const axios = require('axios')

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const TOKEN = process.env.WHATSAPP_TOKEN
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v15.0'

if (!PHONE_ID || !TOKEN) {
  // Not throwing here; some envs (local dev) may not have these set.
}

async function sendText(to, text) {
  if (!PHONE_ID || !TOKEN) throw new Error('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN not configured')
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  }
  const res = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
  })
  return res.data
}

async function sendMedia(to, mediaUrl, mediaType = 'image') {
  if (!PHONE_ID || !TOKEN) throw new Error('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN not configured')
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: mediaType,
    [mediaType]: { link: mediaUrl }
  }
  const res = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
  })
  return res.data
}

async function sendTemplate(to, templateName, language = 'en_US', components = []) {
  if (!PHONE_ID || !TOKEN) throw new Error('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN not configured')
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components
    }
  }
  const res = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
  })
  return res.data
}

async function getMediaUrl(mediaId) {
  if (!TOKEN) throw new Error('WHATSAPP_TOKEN not configured')
  const url = `https://graph.facebook.com/${API_VERSION}/${mediaId}`
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
  return res.data && res.data.url
}

module.exports = { sendText }
