'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [setupNeeded, setSetupNeeded] = useState(null)
  const [loading, setLoading] = useState(true)
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const res = await fetch(BACKEND + '/api/setup/status')
      const data = await res.json()
      setSetupNeeded(!data.setup)
      setLoading(false)
    } catch (err) {
      console.error('Setup check failed:', err)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ setupNeeded, loading, checkSetupStatus, BACKEND }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
