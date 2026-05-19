'use client'
import React, { useEffect, useState, useRef, FC } from 'react'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  text: string
  sender: string
  status?: string
}

interface AdminFormData {
  username: string
  password: string
  name: string
  email: string
}

interface WhatsAppFormData {
  phone_id: string
  token: string
  api_version: string
}

const ChatClient: FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [to, setTo] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateLang, setTemplateLang] = useState('en_US')
  const socketRef = useRef<Socket | null>(null)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [adminForm, setAdminForm] = useState<AdminFormData>({ username: '', password: '', name: '', email: '' })
  const [waForm, setWaForm] = useState<WhatsAppFormData>({ phone_id: '', token: '', api_version: 'v15.0' })
  const [setupStep, setSetupStep] = useState(0)

  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL) || 'http://localhost:4000'

  useEffect(() => {
    fetch(BACKEND + '/api/setup/status')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.setup) {
          setSetupNeeded(false)
          fetch(BACKEND + '/api/messages')
            .then((r) => r.json())
            .then((msgs) => setMessages(msgs))
            .catch(() => setMessages([]))
          socketRef.current = io(BACKEND)
          socketRef.current.on('message', (msg: Message) => setMessages((m) => [...m, msg]))
          socketRef.current.on('status', ({ id, status }: { id: string; status: string }) => {
            setMessages((m) => m.map(msg => msg.id === id ? { ...msg, status } : msg))
          })
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
    if (to) {
      await fetch(BACKEND + '/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, text })
      })
    } else {
      await fetch(BACKEND + '/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender: 'web' })
      })
    }
    setText('')
  }

  const createAdmin = async () => {
    const resp = await fetch(BACKEND + '/api/setup/create-admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminForm)
    })
    if (resp.ok) {
      setSetupStep(1)
    } else {
      alert('Failed to create admin')
    }
  }

  const saveWa = async () => {
    const resp = await fetch(BACKEND + '/api/setup/whatsapp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(waForm)
    })
    if (resp.ok) {
      window.location.reload()
    } else {
      alert('Failed to save WhatsApp account')
    }
  }

  const sendMedia = async () => {
    if (!to || !mediaUrl) return
    await fetch(BACKEND + '/api/messages/sendMedia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, mediaUrl, mediaType: 'image' })
    })
    setMediaUrl('')
  }

  const sendTemplate = async () => {
    if (!to || !templateName) return
    await fetch(BACKEND + '/api/messages/sendTemplate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, templateName, language: templateLang, components: [] })
    })
    setTemplateName('')
  }

  if (!setupNeeded) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">WhatsApp Team Inbox</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Messages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className="p-3 bg-gray-100 rounded">
                  <p className="font-semibold text-sm">{msg.sender}</p>
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
            </div>
            <input
              placeholder="Recipient"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <textarea
              placeholder="Message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <button
              onClick={send}
              className="w-full bg-primary text-white px-4 py-2 rounded font-semibold"
            >
              Send
            </button>
          </div>

          {/* Media & Template */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Send Media</h2>
              <input
                placeholder="Recipient"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <input
                placeholder="Media URL"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <button
                onClick={sendMedia}
                className="w-full bg-primary text-white px-4 py-2 rounded font-semibold"
              >
                Send Media
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Send Template</h2>
              <input
                placeholder="Recipient"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <input
                placeholder="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <select
                value={templateLang}
                onChange={(e) => setTemplateLang(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              >
                <option value="en_US">English</option>
                <option value="es_ES">Spanish</option>
              </select>
              <button
                onClick={sendTemplate}
                className="w-full bg-primary text-white px-4 py-2 rounded font-semibold"
              >
                Send Template
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {setupStep === 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Create Admin</h2>
            <input
              placeholder="Username"
              value={adminForm.username}
              onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              placeholder="Name"
              value={adminForm.name}
              onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <button
              onClick={createAdmin}
              className="w-full bg-primary text-white px-4 py-2 rounded font-semibold"
            >
              Create Admin
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6">Setup WhatsApp</h2>
            <input
              placeholder="Phone ID"
              value={waForm.phone_id}
              onChange={(e) => setWaForm({ ...waForm, phone_id: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="Token"
              value={waForm.token}
              onChange={(e) => setWaForm({ ...waForm, token: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              placeholder="API Version"
              value={waForm.api_version}
              onChange={(e) => setWaForm({ ...waForm, api_version: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <button
              onClick={saveWa}
              className="w-full bg-primary text-white px-4 py-2 rounded font-semibold"
            >
              Save WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatClient
