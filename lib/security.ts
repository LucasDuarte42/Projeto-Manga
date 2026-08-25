import { createHash } from 'crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()
let warnedAboutMissingConfig = false

function getRedis(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (!warnedAboutMissingConfig) {
      console.warn(
        'KV_REST_API_URL/KV_REST_API_TOKEN ou UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN não configuradas.'
      )
      warnedAboutMissingConfig = true
    }
    return null
  }

  if (!redis) {
    redis = new Redis({ url, token })
  }

  return redis
}

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const client = getRedis()
  if (!client) return null

  const windowMinutes = Math.max(1, Math.ceil(windowMs / 60_000))
  const configKey = `${limit}:${windowMinutes}`
  const existing = limiters.get(configKey)

  if (existing) return existing

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(limit, `${windowMinutes} m`),
    analytics: true,
    prefix: 'pinakes:rate-limit',
  })

  limiters.set(configKey, limiter)
  return limiter
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}

export async function consumeRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): Promise<boolean> {
  const limiter = getLimiter(limit, windowMs)

  if (!limiter) {
    // Em desenvolvimento, permite testar sem Redis. Em produção, bloqueia
    // para não deixar as rotas sensíveis sem proteção por configuração ausente.
    return process.env.NODE_ENV !== 'production'
  }

  try {
    const result = await limiter.limit(key)
    return result.success
  } catch (error) {
    console.error('Falha ao consultar o rate limiting do Upstash:', error)
    return process.env.NODE_ENV !== 'production'
  }
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
