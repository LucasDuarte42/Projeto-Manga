import { NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { createShareToken } from '@/lib/share-token'

export const dynamic = 'force-dynamic'

function serverError(error: unknown) {
  console.error('[collection-share]', error)
  const message = error instanceof Error && error.message.includes('CollectionShare')
    ? 'A tabela de compartilhamento ainda não existe. Execute npx prisma migrate deploy.'
    : 'Não foi possível processar o compartilhamento agora.'
  return NextResponse.json({ error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET() {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const shares = await prisma.collectionShare.findMany({
      where: { userId: session.user.id, revokedAt: null },
      select: { id: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(shares, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { expiresInDays?: unknown }
    const expiresInDays = typeof body.expiresInDays === 'number' && Number.isInteger(body.expiresInDays)
      ? Math.min(Math.max(body.expiresInDays, 1), 90)
      : null
    const { token, tokenHash } = createShareToken()
    const share = await prisma.collectionShare.create({
      data: {
        tokenHash,
        userId: session.user.id,
        expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null,
      },
      select: { id: true, expiresAt: true, createdAt: true },
    })

    return NextResponse.json({ ...share, token }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { id?: unknown }
    if (typeof body.id !== 'string' || !body.id) return NextResponse.json({ error: 'ID do compartilhamento inválido' }, { status: 400 })

    const result = await prisma.collectionShare.updateMany({
      where: { id: body.id, userId: session.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (result.count === 0) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverError(error)
  }
}
