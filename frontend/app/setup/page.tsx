'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface AdminForm {
  username: string
  password: string
  name: string
  email: string
}

interface WhatsAppForm {
  phone_id: string
  token: string
  api_version: string
}

export default function SetupPage() {
  const router = useRouter()
  const { setupNeeded, BACKEND, checkSetupStatus } = useAuth()
  const [setupStep, setSetupStep] = useState(0)
  const [adminForm, setAdminForm] = useState<AdminForm>({ username: '', password: '', name: '', email: '' })
  const [waForm, setWaForm] = useState<WhatsAppForm>({ phone_id: '', token: '', api_version: 'v15.0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (setupNeeded === false) {
      router.push('/')
    }
  }, [setupNeeded, router])

  const createAdmin = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch(BACKEND + '/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      })
      if (resp.ok) {
        await checkSetupStatus()
        setAdminForm({ username: '', password: '', name: '', email: '' })
        router.push('/')
        return
      } else {
        const data = await resp.json()
        setError(data.error || 'Failed to create admin')
      }
    } catch (err) {
      const error = err as Error
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testWhatsApp = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch(BACKEND + '/api/setup/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waForm),
      })
      const data = await resp.json()
      if (resp.ok) {
        alert('✓ Credentials valid')
      } else {
        setError('Invalid credentials: ' + (data.error?.message || JSON.stringify(data.error)))
      }
    } catch (err) {
      const error = err as Error
      setError('Test failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const saveWhatsApp = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch(BACKEND + '/api/setup/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waForm),
      })
      if (resp.ok) {
        await checkSetupStatus()
        router.push('/')
      } else {
        const data = await resp.json()
        setError(data.error || 'Failed to save WhatsApp account')
      }
    } catch (err) {
      const error = err as Error
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (setupNeeded === null) return <div className="text-center py-8">Loading...</div>
  if (setupNeeded === false) return null

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">Create Admin Account</h2>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          <div className="space-y-4">
            <input
              placeholder="Username"
              value={adminForm.username}
              onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Password"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              placeholder="Name"
              value={adminForm.name}
              onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="email"
              placeholder="Email"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={createAdmin}
              disabled={loading}
              className="w-full bg-primary text-white px-6 py-2 rounded-md font-semibold hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
