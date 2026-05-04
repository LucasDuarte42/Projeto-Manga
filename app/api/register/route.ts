import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'

// Rate limiting simples em memória
const attempts = new Map<string, { count: number; lastAttempt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutos
  const maxAttempts = 5

  const record = attempts.get(ip)

  if (!record) {
    attempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }

  if (now - record.lastAttempt > windowMs) {
    attempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }

  if (record.count >= maxAttempts) return false

  record.count++
  record.lastAttempt = now
  return true
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    )
  }

  const { name, email, password } = result.data

  const exists = await prisma.user.findUnique({ where: { email } })

  if (exists) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}