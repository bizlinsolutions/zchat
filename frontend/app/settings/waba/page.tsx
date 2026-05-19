'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { MdContentCopy, MdCheckCircle, MdError, MdInfo } from 'react-icons/md'

export default function WabaSettingsPage() {
  const router = useRouter()
  const { BACKEND, checkSetupStatus } = useAuth()
  const [waForm, setWaForm] = useState({ phone_id: '', token: '', api_version: 'v15.0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState<any[]>([])
  const [webhookConfig, setWebhookConfig] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
    fetchWebhookConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAccounts = async () => {
    try {
      const resp = await fetch(BACKEND + '/api/setup/whatsapp')
      if (resp.ok) {
        const data = await resp.json()
        setAccounts(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      /* ignore */
    }
  }

  const fetchWebhookConfig = async () => {
    try {
      const resp = await fetch(BACKEND + '/api/setup/webhook-config')
      if (resp.ok) {
        const data = await resp.json()
        setWebhookConfig(data)
      }
    } catch (err) {
      /* ignore */
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
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
        await fetchAccounts()
        setWaForm({ phone_id: '', token: '', api_version: 'v15.0' })
        return
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

  const selectAccount = (acc: any) => {
    setWaForm({ phone_id: acc.phone_id || '', token: acc.token || '', api_version: acc.api_version || 'v15.0' })
  }

  const newAccount = () => {
    setWaForm({ phone_id: '', token: '', api_version: 'v15.0' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Webhook Configuration Section */}
        {webhookConfig && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <MdInfo className="text-blue-600 mr-3 text-2xl" />
              <h2 className="text-2xl font-bold">Webhook Configuration for Meta</h2>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-semibold mb-2">Follow these steps to connect your WhatsApp Business Account:</p>
              <ol className="list-decimal list-inside space-y-2 text-blue-900">
                {webhookConfig.instructions && Object.entries(webhookConfig.instructions).map(([key, value], idx) => (
                  <li key={idx} className="text-sm">{value as string}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-4 mb-6">
              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Webhook Callback URL
                </label>
                <p className="text-xs text-gray-500 mb-2">{webhookConfig.webhookUrlNote}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={webhookConfig.webhookUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookConfig.webhookUrl, 'webhook')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'webhook' ? (
                      <>
                        <MdCheckCircle />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <MdContentCopy />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Verify Token */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Webhook Verify Token
                </label>
                <p className="text-xs text-gray-500 mb-2">{webhookConfig.verifyTokenNote}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={webhookConfig.verifyToken}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookConfig.verifyToken, 'token')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'token' ? (
                      <>
                        <MdCheckCircle />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <MdContentCopy />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Webhook Fields */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Webhook Fields to Subscribe
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  In Meta Developers, select these fields in Step 6:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['messages', 'message_status', 'message_template_status_update'].map((field) => (
                    <div
                      key={field}
                      className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm flex items-center gap-2"
                    >
                      <MdCheckCircle className="text-green-600" />
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-900 text-sm">
                <strong>Note:</strong> Make sure your server is accessible from the internet before setting up the webhook in Meta Developers.
              </p>
            </div>
          </div>
        )}

        {/* WABA Settings Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">WhatsApp Account Credentials</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
              <MdError />
              {error}
            </div>
          )}
          <div className="space-y-4">
            {accounts.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Saved WABAs</h3>
                <div className="space-y-2">
                  {accounts.map((a) => (
                    <button
                      key={a.phone_id}
                      onClick={() => selectAccount(a)}
                      className="w-full text-left px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 transition"
                    >
                      <div className="font-medium">{a.phone_id}</div>
                      <div className="text-sm text-gray-500">{a.api_version || 'v15.0'}</div>
                    </button>
                  ))}
                  <button onClick={newAccount} className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                    + Add new WABA
                  </button>
                </div>
              </div>
            )}
            <input
              placeholder="Phone ID"
              value={waForm.phone_id}
              onChange={(e) => setWaForm({ ...waForm, phone_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="API Token"
              type="password"
              value={waForm.token}
              onChange={(e) => setWaForm({ ...waForm, token: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="API Version (e.g., v15.0)"
              value={waForm.api_version}
              onChange={(e) => setWaForm({ ...waForm, api_version: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={testWhatsApp}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 mb-2 transition"
            >
              {loading ? 'Testing...' : 'Test Credentials'}
            </button>
            <button
              onClick={saveWhatsApp}
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Save & Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
