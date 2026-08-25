import { createHash } from 'crypto'

type RateLimitRecord = {
  count: number
  resetAt: number
}

const records = new Map<string, RateLimitRecord>()

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const current = records.get(key)

  if (!current || current.resetAt <= now) {
    records.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (current.count >= limit) return false

  current.count += 1
  return true
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
