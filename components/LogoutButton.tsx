'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Sair da conta"
      className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
    >
      <LogOut size={17} />

      <span className="hidden sm:inline">
        {isSigningOut ? 'Saindo...' : 'Sair'}
      </span>
    </button>
  )
}
