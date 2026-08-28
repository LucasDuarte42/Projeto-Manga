import { createHash, randomBytes } from 'crypto'

export function createShareToken() {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  return { token, tokenHash }
}

export function hashShareToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
