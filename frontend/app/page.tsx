'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface StatCard {
  label: string
  value: string | number
  color: string
  href: string
}

interface MenuItem {
  label: string
  href: string
  description: string
  icon: string
}

export default function DashboardPage() {
  const { BACKEND } = useAuth()
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalContacts: 0,
    avgResponseTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [BACKEND])

  const fetchDashboardStats = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch message count
      const countRes = await fetch(BACKEND + '/api/analytics/messages-count')
      const countData = await countRes.json()

      // Fetch response times
      const responseRes = await fetch(BACKEND + '/api/analytics/response-times')
      const responseData = await responseRes.json()

      // Fetch contacts
      const contactRes = await fetch(BACKEND + '/api/contacts')
      const contactData = await contactRes.json()

      setStats({
        totalMessages: countData.count || 0,
        totalContacts: (contactData || []).length,
        avgResponseTime: responseData.avg_response_ms || 0,
      })
    } catch (err) {
      const error = err as Error
      setError('Failed to load dashboard stats: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const statCards: StatCard[] = [
    {
      label: 'Total Messages',
      value: stats.totalMessages,
      color: 'indigo',
      href: '/chat',
    },
    {
      label: 'Contacts',
      value: stats.totalContacts,
      color: 'blue',
      href: '/contacts',
    },
    {
      label: 'Avg Response Time',
      value: stats.avgResponseTime ? `${Math.round(stats.avgResponseTime / 1000)}s` : 'N/A',
      color: 'green',
      href: '/analytics',
    },
  ]

  const menuItems: MenuItem[] = [
    { label: 'Chat', href: '/chat', description: 'Send and receive messages', icon: '💬' },
    { label: 'Contacts', href: '/contacts', description: 'Manage your contacts', icon: '👥' },
    { label: 'Assignments', href: '/assignments', description: 'Assign messages to agents', icon: '👤' },
    { label: 'Analytics', href: '/analytics', description: 'View detailed analytics', icon: '📊' },
  ]

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
  <div className="space-y-8">
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer`}
            >
              <h3 className={`text-sm font-semibold text-gray-600 uppercase`}>{card.label}</h3>
                <p className={`text-4xl font-bold text-primary mt-2`}>{card.value}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Navigation Menu */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start gap-4"
            >
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
