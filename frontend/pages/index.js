import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [to, setTo] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateLang, setTemplateLang] = useState('en_US')
  const socketRef = useRef(null)

  useEffect(() => {
    fetch('http://localhost:4000/api/messages')
      .then((r) => r.json())
      .then((d) => setMessages(d))
      .catch(() => setMessages([]))

    socketRef.current = io('http://localhost:4000')
    socketRef.current.on('message', (msg) => {
      setMessages((m) => [...m, msg])
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  const send = async () => {
    if (!text) return
    // If `to` is provided, send via WhatsApp Cloud API through backend
    if (to) {
      await fetch('http://localhost:4000/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, text })
      })
    } else {
      await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender: 'web' })
      })
    }
    setText('')
  }

  const sendMedia = async () => {
    if (!to || !mediaUrl) return
    await fetch('http://localhost:4000/api/sendMedia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, mediaUrl, mediaType: 'image' })
    })
    setMediaUrl('')
  }

  const sendTemplate = async () => {
    if (!to || !templateName) return
    await fetch('http://localhost:4000/api/sendTemplate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, templateName, language: templateLang, components: [] })
    })
    setTemplateName('')
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>WhatsApp Team Inbox (Frontend)</h1>
      <div style={{ maxWidth: 720 }}>
        <div style={{ border: '1px solid #ddd', padding: 12, minHeight: 200 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: 12, color: '#666' }}>{m.sender} • {new Date(m.ts).toLocaleTimeString()}</div>
              <div>{m.text}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', marginTop: 12, gap: 8 }}>
          <input placeholder="To (WhatsApp number, optional)" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 220, padding: 8 }} />
          <input value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1, padding: 8 }} />
          <button onClick={send} style={{ padding: '8px 12px' }}>Send</button>
        </div>
        <div style={{ display: 'flex', marginTop: 8, gap: 8 }}>
          <input placeholder="Media URL (optional)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} style={{ flex: 1, padding: 8 }} />
          <button onClick={sendMedia} style={{ padding: '8px 12px' }}>Send Media</button>
        </div>
        <div style={{ display: 'flex', marginTop: 8, gap: 8 }}>
          <input placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} style={{ width: 240, padding: 8 }} />
          <input placeholder="lang" value={templateLang} onChange={(e) => setTemplateLang(e.target.value)} style={{ width: 100, padding: 8 }} />
          <button onClick={sendTemplate} style={{ padding: '8px 12px' }}>Send Template</button>
        </div>
      </div>
    </main>
  )
}
