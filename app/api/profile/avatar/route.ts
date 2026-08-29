import { NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { profileAvatarSchema } from '@/lib/validations'

export async function PUT(req: Request) {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const parsed = profileAvatarSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl: parsed.data.avatarUrl } })
    return NextResponse.json({ avatarUrl: parsed.data.avatarUrl })
  } catch (error) {
    console.error('Erro ao salvar foto de perfil:', error)
    return NextResponse.json({ error: 'Não foi possível salvar a foto de perfil.' }, { status: 500 })
  }
}
