'use client'
import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/context/AuthContext'
import { MdChat, MdSend, MdAdd, MdRefresh, MdCheckCircle, MdError, MdSchedule, MdInbox, MdChatBubbleOutline, MdArrowBack, MdPhone } from 'react-icons/md'
import MessageRenderer from '@/components/MessageRenderer'

interface Message {
  id: string
  text: string
  sender: string
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending' | 'sending' | null
  wa_id?: string | null
  ts?: number
  timestamp?: number
  type?: string
  media_url?: string | null
  metadata?: string
  direction?: 'inbound' | 'outbound'
}

interface Contact {
  wa_id: string
  name?: string
}

interface ChatEntry {
  wa_id: string
  name: string
  text: string
  ts: number
}

export default function ChatPage() {
  const { BACKEND } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedWaId, setSelectedWaId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [newTo, setNewTo] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateLang, setTemplateLang] = useState('en_US')
  const [loading, setLoading] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    fetchMessages()
    fetchContacts()
    socketRef.current = io(BACKEND)
    socketRef.current.on('message', (msg: Message) => setMessages((m) => [...m, msg]))
    socketRef.current.on('status', ({ id, status }: { id: string; status: string }) => {
      setMessages((m) => m.map(msg => msg.id === id ? { ...msg, status: status as Message['status'] } : msg))
    })

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [BACKEND])

  const fetchMessages = async () => {
    try {
      const res = await fetch(BACKEND + '/api/messages')
      const msgs = await res.json()
      if (Array.isArray(msgs)) {
        setMessages(msgs)
      } else {
        console.warn('Unexpected messages response:', msgs)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const fetchContacts = async () => {
    try {
      const res = await fetch(BACKEND + '/api/contacts')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setContacts(list)
      if (!selectedWaId && list.length) setSelectedWaId(list[0].wa_id)
    } catch (err) {
      console.error('Failed to load contacts:', err)
    }
  }

  const latestFor = (wa_id: string) => {
    const msgs = messages.filter(m => m.wa_id === wa_id)
    if (!msgs.length) return ''
    const latest = msgs.reduce((a, b) => ((a.ts || 0) > (b.ts || 0) ? a : b))
    return latest.text
  }

  // Build chats from messages grouped by wa_id (most recent first)
  const chats = React.useMemo(() => {
    const map = new Map<string, ChatEntry>()
    for (const m of messages) {
      if (!m.wa_id) continue
      const ts = m.ts || 0
      const cur = map.get(m.wa_id)
      if (!cur || ts > cur.ts) {
        const contact = contacts.find((c) => c.wa_id === m.wa_id)
        map.set(m.wa_id, { wa_id: m.wa_id, name: contact ? contact.name || contact.wa_id : m.wa_id, text: m.text || '', ts })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.ts - a.ts)
  }, [messages, contacts])

  // Auto-select first chat when chats load
  useEffect(() => {
    if (!selectedWaId && chats.length) setSelectedWaId(chats[0].wa_id)
  }, [chats, selectedWaId])

  // Auto-scroll messages area when messages change
  useEffect(() => {
    const el = messagesAreaRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, selectedWaId])

  const send = async () => {
    if (!text) return

    const to = selectedWaId || newTo
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const tempMsg: Message = {
      id: tempId,
      text,
      sender: 'us',
      wa_id: to || null,
      ts: Date.now(),
      status: 'sending',
    }

    // Optimistically show message
    setMessages((m) => [...m, tempMsg])
    setText('')
    setLoading(true)

    try {
      if (to) {
        const res = await fetch(BACKEND + '/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, text }),
        })
        if (res.ok) {
          const serverMsg = await res.json()
          setMessages((prev) => prev.map((m) => (m.id === tempId ? serverMsg : m)))
        } else {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)))
        }
      } else {
        const res = await fetch(BACKEND + '/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, sender: 'web' }),
        })
        if (res.ok) {
          const serverMsg = await res.json()
          setMessages((prev) => prev.map((m) => (m.id === tempId ? serverMsg : m)))
        } else {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)))
        }
      }
    } catch (err) {
      console.error('Send failed:', err)
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)))
    } finally {
      setLoading(false)
    }
  }

  const sendMedia = async () => {
    const to = selectedWaId || newTo
    if (!to || !mediaUrl) {
      alert('Please select recipient and enter media URL')
      return
    }
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const tempMsg: Message = {
      id: tempId,
      text: mediaUrl,
      sender: 'us',
      wa_id: to,
      ts: Date.now(),
      type: 'image',
      media_url: mediaUrl,
      status: 'sending',
    }

    setMessages((m) => [...m, tempMsg])
    setMediaUrl('')
    setLoading(true)
    try {
      const res = await fetch(BACKEND + '/api/messages/sendMedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, mediaUrl, mediaType: 'image' }),
      })
      if (res.ok) {
        const serverMsg = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === tempId ? serverMsg : m)))
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)))
      }
    } catch (err) {
      console.error('Send media failed:', err)
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)))
    } finally {
      setLoading(false)
    }
  }

  const sendTemplate = async () => {
    const to = selectedWaId || newTo
    if (!to || !templateName) {
      alert('Please select recipient and enter template name')
      return
    }
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const tempMsg: Message = {
      id: tempId,
      text: `[template:${templateName}]`,
      sender: 'us',
      wa_id: to,
      ts: Date.now(),
      type: 'template',
      status: 'sending',
    }

    setMessages((m) => [...m, tempMsg])
    setTemplateName('')
    setLoading(true)
    try {
      const res = await fetch(BACKEND + '/api/messages/sendTemplate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, templateName, language: templateLang, components: [] }),
      })
      if (res.ok) {
        const serverMsg = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === tempId ? serverMsg : m)))
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)))
      }
    } catch (err) {
      console.error('Send template failed:', err)
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)))
    } finally {
      setLoading(false)
    }
  }

  const selectedMessages = selectedWaId ? messages.filter(m => m.wa_id === selectedWaId).sort((a,b)=> (a.ts||0)-(b.ts||0)) : []

  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const messagesAreaRef = useRef<HTMLDivElement | null>(null)

  const retryMessage = async (msg: Message) => {
    if (!msg.wa_id) return
    setLoading(true)
    try {
      const res = await fetch(BACKEND + '/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: msg.wa_id, text: msg.text }),
      })
      if (res.ok) {
        const serverMsg = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? serverMsg : m)))
      }
    } catch (err) {
      console.error('Retry failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    if (status === 'failed') return <MdError className="text-red-600" size={14} />
    if (status === 'sending') return <MdSchedule className="text-gray-500 animate-spin" size={14} />
    if (status === 'sent') return <MdCheckCircle className="text-green-600" size={14} />
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const startChat = (phone?: string) => {
    if (phone) {
      setSelectedWaId(phone)
      setNewTo(phone)
      // focus message input
      setTimeout(() => textRef.current?.focus(), 50)
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-56px)] min-h-0 bg-gray-100">
      {/* Left - chats list */}
      <aside className="flex-shrink-0 md:w-64 lg:w-72 bg-white rounded-none shadow p-4 flex flex-col border-r">
        <div className="mb-6 flex items-center gap-2">
          <MdChat className="text-primary" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Chats</h2>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Conversation</label>
          <div className="flex gap-2 mt-2">
            <input 
              placeholder="Phone number..." 
              value={newTo} 
              onChange={(e) => setNewTo(e.target.value)} 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
            <button 
              onClick={() => startChat(newTo)} 
              className="bg-primary hover:bg-primary-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center"
              title="Add new chat"
            >
              <MdAdd size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-1">
          {chats.length === 0 ? (
            <div className="mt-8 text-center text-gray-500 text-sm">
              <MdInbox className="mx-auto mb-2 text-3xl" />
              <p>No chats yet.</p>
            </div>
          ) : (
            chats.map((c) => (
              <button 
                key={c.wa_id} 
                onClick={() => setSelectedWaId(c.wa_id)} 
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedWaId === c.wa_id 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <div className="font-semibold text-gray-800 truncate text-sm">{c.name}</div>
                      <div className="text-xs text-gray-500 flex-shrink-0">{c.ts ? new Date(c.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>
                    <p className="text-xs text-gray-600 truncate mt-1">{c.text || 'No messages'}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Right - chat window */}
      <section className="flex-1 flex flex-col min-h-0 bg-gray-50">
        <div className="p-4 border-b bg-white shadow-sm">
          {selectedWaId ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                {getInitials(contacts.find(c=>c.wa_id===selectedWaId)?.name || selectedWaId)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{contacts.find(c=>c.wa_id===selectedWaId)?.name || selectedWaId}</h2>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MdPhone size={12} />
                  {selectedWaId}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <MdArrowBack size={20} />
                <h2 className="text-lg font-medium">Select a chat to start</h2>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesAreaRef} className="flex-1 overflow-auto p-4 flex flex-col gap-3" id="messages-area">
          {selectedMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="text-gray-400">
                <MdChatBubbleOutline className="mx-auto mb-2 text-4xl" />
                <p className="text-gray-600">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            selectedMessages.map((msg) => {
              const msgData = {
                id: msg.id,
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.ts || Date.now(),
                type: msg.type || 'text',
                direction: msg.sender === 'us' ? 'outbound' : 'inbound',
                wa_id: msg.wa_id,
                media_url: msg.media_url,
                status: msg.status,
                metadata: msg.metadata,
              }
              return (
                <MessageRenderer 
                  key={msg.id} 
                  message={msgData as any}
                  onRetry={retryMessage as any}
                />
              )
            })
          )}
        </div>

        <div className="border-t p-4 bg-white">
          <div className="space-y-3">
            <div className="relative">
              <textarea
                ref={textRef}
                placeholder={selectedWaId ? "Type your message..." : "Select a chat first..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                disabled={!selectedWaId}
                rows={3}
                className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                {text.length}/256
              </div>
            </div>
            <div className="flex gap-2 items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={send} 
                  disabled={loading || !text.trim() || !selectedWaId} 
                  className="bg-primary hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  title="Send message"
                >
                  {loading ? (
                    <>
                      <MdSchedule size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MdSend size={18} />
                      Send
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                {selectedWaId ? (
                  <>
                    <MdPhone size={14} />
                    {selectedWaId}
                  </>
                ) : (
                  <>
                    <MdArrowBack size={14} />
                    Select a chat
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
