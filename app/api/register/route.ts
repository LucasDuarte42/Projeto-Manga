import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { consumeRateLimit, getClientIp } from '@/lib/security'

export async function POST(req: Request) {
  const ip = getClientIp(req.headers)

  if (!consumeRateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
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