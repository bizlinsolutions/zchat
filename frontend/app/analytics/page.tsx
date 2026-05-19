'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Stats {
  messagesCount: number
  avgResponseTime: number
  responseSamples: number
  agentStats: any[]
}

export default function AnalyticsPage() {
  const { BACKEND } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [stats, setStats] = useState<Stats>({
    messagesCount: 0,
    avgResponseTime: 0,
    responseSamples: 0,
    agentStats: [],
  })

  useEffect(() => {
    fetchAnalytics()
  }, [BACKEND])

  const fetchAnalytics = async (from: number | null = null, to: number | null = null) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (from) params.append('from', from.toString())
      if (to) params.append('to', to.toString())

      // Fetch message count
      const countRes = await fetch(BACKEND + '/api/analytics/messages-count?' + params)
      const countData = await countRes.json()

      // Fetch response times
      const responseRes = await fetch(BACKEND + '/api/analytics/response-times?' + params)
      const responseData = await responseRes.json()

      // Fetch agent stats
      const agentRes = await fetch(BACKEND + '/api/analytics/agent-stats?' + params)
      const agentData = await agentRes.json()

      setStats({
        messagesCount: countData.count || 0,
        avgResponseTime: responseData.avg_response_ms || 0,
        responseSamples: responseData.samples || 0,
        agentStats: agentData || [],
      })
    } catch (err) {
      const error = err as Error
      setError('Failed to load analytics: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e: React.FormEvent) => {
    e.preventDefault()
    const fromTime = dateRange.from ? new Date(dateRange.from).getTime() : null
    const toTime = dateRange.to ? new Date(dateRange.to).getTime() : null
    fetchAnalytics(fromTime, toTime)
  }

  const exportToCSV = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const fromTime = dateRange.from ? new Date(dateRange.from).getTime() : null
      const toTime = dateRange.to ? new Date(dateRange.to).getTime() : null
      if (fromTime) params.append('from', fromTime.toString())
      if (toTime) params.append('to', toTime.toString())
      params.append('format', 'csv')

      const res = await fetch(BACKEND + '/api/analytics/export?' + params)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'messages.csv'
      a.click()
    } catch (err) {
      const error = err as Error
      setError('Failed to export: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Analytics</h2>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filter by Date Range</h3>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleFilterChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="datetime-local"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="datetime-local"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Filter'}
            </button>
          </div>
        </form>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-600 uppercase">Total Messages</h4>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.messagesCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-600 uppercase">Avg Response Time</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats.avgResponseTime ? `${Math.round(stats.avgResponseTime / 1000)}s` : 'N/A'}
          </p>
          <p className="text-xs text-gray-600 mt-2">{stats.responseSamples} samples</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={exportToCSV}
            disabled={loading}
            className="w-full bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>

      {/* Agent Stats Table */}
      {stats.agentStats.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="text-xl font-semibold p-6 border-b">Agent Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Agent ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Message Count</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Avg Response Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.agentStats.map((agent, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono">{agent.agent_id || idx}</td>
                    <td className="px-6 py-4 text-sm">{agent.count || 0}</td>
                    <td className="px-6 py-4 text-sm">
                      {agent.avg_response_ms ? `${Math.round(agent.avg_response_ms / 1000)}s` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
