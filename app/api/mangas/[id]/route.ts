import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const manga = await prisma.manga.findUnique({ where: { id: params.id } })

  if (!manga || manga.userId !== session.user.id) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  return NextResponse.json(manga)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const manga = await prisma.manga.findUnique({ where: { id: params.id } })

  if (!manga || manga.userId !== session.user.id) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  const body = await req.json()

const updated = await prisma.manga.update({
  where: { id: params.id },
  data: {
    name:         body.name,
    author:       body.author ?? null,
    volume:       parseInt(body.volume),
    totalVolumes: body.totalVolumes ?? null,
    ownedVolumes: body.ownedVolumes ?? [],
    status:       body.status,
    note:         body.note ?? null,
    genre:        body.genre ?? null,
    coverUrl:     body.coverUrl ?? null,
  },
})

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const manga = await prisma.manga.findUnique({ where: { id: params.id } })

  if (!manga || manga.userId !== session.user.id) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  await prisma.manga.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}