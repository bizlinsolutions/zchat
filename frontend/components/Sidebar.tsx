"use client"
import React, { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Sidebar: FC = () => {
  const pathname = usePathname()

  // Hide the common left sidebar on the chat page
  if (pathname && pathname.startsWith('/chat')) return null

  const nav = [
    { href: '/', label: 'Dashboard' },
    { href: '/chat', label: 'Chat' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/settings/waba', label: 'WABA Settings' },
    // Assignments removed from UI
    { href: '/analytics', label: 'Analytics' },
  ]

  return (
    <aside className="w-64 bg-primary text-white min-h-screen">
      <div className="px-4 py-6">
        <div className="text-xl font-semibold mb-6">Team Inbox</div>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`block px-3 py-2 rounded hover:bg-primary-600`}>{n.label}</Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
