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
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [adminForm, setAdminForm] = useState({ username: '', password: '', name: '', email: '' })
  const [waForm, setWaForm] = useState({ phone_id: '', token: '', api_version: 'v15.0' })
  const [setupStep, setSetupStep] = useState(0)

  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL) || 'http://localhost:4000'

  useEffect(() => {
    // check setup status first
    fetch(BACKEND + '/api/setup/status')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.setup) {
          setSetupNeeded(false)
          // load messages and connect socket
          fetch(BACKEND + '/api/messages')
            .then((r) => r.json())
            .then((msgs) => setMessages(msgs)).catch(() => setMessages([]))
          socketRef.current = io(BACKEND)
          socketRef.current.on('message', (msg) => setMessages((m) => [...m, msg]))
        } else {
          setSetupNeeded(true)
          setSetupStep(0)
        }
      })

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
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

  const createAdmin = async () => {
    const resp = await fetch('/api/setup/create-admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminForm)
    })
    if (resp.ok) {
      setSetupStep(1)
    } else {
      alert('Failed to create admin')
    }
  }

  const saveWa = async () => {
    const resp = await fetch('/api/setup/whatsapp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(waForm)
    })
    if (resp.ok) {
      // reload page to initialize socket/messages
      window.location.reload()
    } else {
      alert('Failed to save WhatsApp account')
    }
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
        {setupNeeded ? (
          <div>
            {setupStep === 0 ? (
              <div>
                <h2>Initial setup — create admin</h2>
                <input placeholder="username" value={adminForm.username} onChange={(e)=>setAdminForm({...adminForm, username: e.target.value})} style={{padding:8, display:'block', marginBottom:8}} />
                <input placeholder="password" type="password" value={adminForm.password} onChange={(e)=>setAdminForm({...adminForm, password: e.target.value})} style={{padding:8, display:'block', marginBottom:8}} />
                <input placeholder="name" value={adminForm.name} onChange={(e)=>setAdminForm({...adminForm, name: e.target.value})} style={{padding:8, display:'block', marginBottom:8}} />
                <input placeholder="email" value={adminForm.email} onChange={(e)=>setAdminForm({...adminForm, email: e.target.value})} style={{padding:8, display:'block', marginBottom:8}} />
                <button onClick={createAdmin} style={{padding:'8px 12px'}}>Create Admin</button>
              </div>
            ) : (
              <div>
                <h2>Configure WhatsApp Cloud API</h2>
                <input placeholder="phone_id" value={waForm.phone_id} onChange={(e)=>setWaForm({...waForm, phone_id: e.target.value})} style={{padding:8, display:'block', marginBottom:8}} />
                <input placeholder="token" value={waForm.token} onChange={(e)=>setWaForm({...waForm, token: e.target.value})} style={{padding:8, display:'block', marginBottom:8}} />
                <input placeholder="api_version" value={waForm.api_version} onChange={(e)=>setWaForm({...waForm, api_version: e.target.value})} style={{padding:8, display:'block', marginBottom:8}} />
                <div style={{display:'flex', gap:8}}>
                  <button onClick={async()=>{
                    // test credentials
                    try {
                      const r = await fetch(BACKEND + '/api/setup/test-whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(waForm) })
                      const j = await r.json()
                      if (r.ok) alert('Credentials valid')
                      else alert('Invalid credentials: ' + (j.error?.message || JSON.stringify(j.error)))
                    } catch (e) { alert('Test failed: '+e.message) }
                  }} style={{padding:'8px 12px'}}>Test</button>
                  <button onClick={saveWa} style={{padding:'8px 12px'}}>Save WhatsApp Account</button>
                </div>
              </div>
            )}
          </div>
        ) : (
        
        <div>
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
        )}
      </div>
    </main>
  )
}
