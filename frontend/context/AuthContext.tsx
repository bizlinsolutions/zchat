'use client'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  type FC,
} from 'react'

interface AuthContextType {
  setupNeeded: boolean | null
  loading: boolean
  checkSetupStatus: () => Promise<void>
  BACKEND: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async (): Promise<void> => {
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
