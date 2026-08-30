import { NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'

export async function requireAdminSession() {
  const session = await requireUserSession()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const userEmail = session?.user?.email?.trim().toLowerCase()

  if (!session?.user?.id || !adminEmail || userEmail !== adminEmail) {
    return null
  }

  return session
}

export function forbiddenAdminResponse() {
  return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
}
