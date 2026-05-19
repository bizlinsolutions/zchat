import React, { FC } from 'react'

const Header: FC = () => {
  return (
    <header className="w-full bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center text-white font-bold">WA</div>
          <div className="text-lg font-semibold text-primary">WhatsApp Team Inbox</div>
        </div>
        <div className="text-sm text-gray-600">Admin</div>
      </div>
    </header>
  )
}

export default Header
