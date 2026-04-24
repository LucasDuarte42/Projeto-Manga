import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const manga = await prisma.manga.findUnique({
    where: { id: params.id },
  })

  if (!manga || manga.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.manga.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const manga = await prisma.manga.findUnique({
    where: { id: params.id },
  })

  if (!manga || manga.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.manga.update({
    where: { id: params.id },
    data: {
      name: body.name,
      volume: parseInt(body.volume),
      status: body.status,
      genre: body.genre || null,
      note: body.note ? parseFloat(body.note) : null,
    },
  })

  return NextResponse.json(updated)
}