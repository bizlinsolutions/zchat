const axios = require('axios')

const API_DEFAULT = 'v15.0'

function makeUrl(apiVersion, phoneId) {
  return `https://graph.facebook.com/${apiVersion || API_DEFAULT}/${phoneId}/messages`
}

async function sendText(account, to, text) {
  const phoneId = account && account.phone_id
  const token = account && account.token
  const apiVersion = (account && account.api_version) || API_DEFAULT
  if (!phoneId || !token) throw new Error('WhatsApp account not configured')
  const url = makeUrl(apiVersion, phoneId)
  const body = { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  return res.data
}

async function sendMedia(account, to, mediaUrl, mediaType = 'image') {
  const phoneId = account && account.phone_id
  const token = account && account.token
  const apiVersion = (account && account.api_version) || API_DEFAULT
  if (!phoneId || !token) throw new Error('WhatsApp account not configured')
  const url = makeUrl(apiVersion, phoneId)
  const body = { messaging_product: 'whatsapp', to, type: mediaType, [mediaType]: { link: mediaUrl } }
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  return res.data
}

async function sendTemplate(account, to, templateName, language = 'en_US', components = []) {
  const phoneId = account && account.phone_id
  const token = account && account.token
  const apiVersion = (account && account.api_version) || API_DEFAULT
  if (!phoneId || !token) throw new Error('WhatsApp account not configured')
  const url = makeUrl(apiVersion, phoneId)
  const body = { messaging_product: 'whatsapp', to, type: 'template', template: { name: templateName, language: { code: language }, components } }
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  return res.data
}

async function getMediaUrl(account, mediaId) {
  const token = account && account.token
  const apiVersion = (account && account.api_version) || API_DEFAULT
  if (!token) throw new Error('WhatsApp token not configured')
  const url = `https://graph.facebook.com/${apiVersion}/${mediaId}`
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
  return res.data && res.data.url
}

module.exports = { sendText, sendMedia, sendTemplate, getMediaUrl }
