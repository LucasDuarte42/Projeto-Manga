import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })

  if (exists) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}