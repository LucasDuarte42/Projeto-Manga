import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireUserSession() {
  const session = await getServerSession(authOptions)
  return session?.user?.id ? session : null
}
