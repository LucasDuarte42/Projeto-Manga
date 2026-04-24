import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const mangas = await prisma.manga.findMany({
    where: {
      userId: session.user.id,
      ...(status && { status: status as any }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(mangas)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, volume, status, genre, note } = body

  if (!name || !volume) {
    return NextResponse.json({ error: 'Nome e volume são obrigatórios' }, { status: 400 })
  }

  const manga = await prisma.manga.create({
    data: {
      name,
      volume: parseInt(volume),
      status: status || 'WANT_TO_READ',
      genre: genre || null,
      note: note ? parseFloat(note) : null,
      userId: session.user.id,
    },
  })

  return NextResponse.json(manga, { status: 201 })
}