import { NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { isAdminEmail } from '@/lib/admin-email'

export { isAdminEmail }

export async function requireAdminSession() {
  const session = await requireUserSession()

  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return null
  }

  return session
}

export function forbiddenAdminResponse() {
  return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
}
