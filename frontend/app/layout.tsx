"use client"
import '../styles/globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export const metadata = {
  title: 'WhatsApp Team Inbox',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname()

  // Remove side margins and center container for chat page
  const mainClass = pathname && pathname.startsWith('/chat')
    ? 'flex-1 w-full px-0 py-0 min-h-0'
    : 'flex-1 max-w-6xl mx-auto px-6 py-6'

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">
        <AuthProvider>
          <Header />
          <div className="flex">
            <Sidebar />
            <main className={mainClass}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
