'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Contact {
  id: string
  wa_id: string
  name: string
  phone: string
  email: string
}

export default function ContactsPage() {
  const { BACKEND } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ wa_id: '', name: '', phone: '', email: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContacts()
  }, [BACKEND])

  const fetchContacts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(BACKEND + '/api/contacts')
      const data = await res.json()
      setContacts(data || [])
    } catch (err) {
      const error = err as Error
      setError('Failed to load contacts: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.wa_id) {
      setError('WhatsApp ID is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(BACKEND + '/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await fetchContacts()
        setForm({ wa_id: '', name: '', phone: '', email: '' })
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add contact')
      }
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Contacts</h2>

      {/* Add Contact Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Add New Contact</h3>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        <form onSubmit={addContact} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="WhatsApp ID (required)"
              value={form.wa_id}
              onChange={(e) => setForm({ ...form, wa_id: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Contact'}
          </button>
        </form>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-xl font-semibold p-6 border-b">Contact List</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">WhatsApp ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No contacts yet
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{contact.wa_id}</td>
                    <td className="px-6 py-4 text-sm">{contact.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">{contact.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm">{contact.email || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
