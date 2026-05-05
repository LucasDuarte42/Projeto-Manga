import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const mangas = await prisma.manga.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(mangas)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { name, author, coverUrl, volume, totalVolumes, status, note, genre } = body

  if (!name) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }

  // Evita duplicata (mesmo userId + name + volume)
  const existing = await prisma.manga.findUnique({
    where: { userId_name_volume: { userId: session.user.id, name, volume: volume ?? 1 } },
  })

  if (existing) {
    return NextResponse.json({ error: 'Manga já está na coleção' }, { status: 409 })
  }

  const manga = await prisma.manga.create({
    data: {
      name,
      author:       author ?? null,
      coverUrl:     coverUrl ?? null,
      volume:       volume ?? 1,
      totalVolumes: totalVolumes ?? null,
      status:       status ?? 'WANT_TO_READ',
      note:         note ?? null,
      genre:        genre ?? null,
      userId:       session.user.id,
    },
  })

  return NextResponse.json(manga, { status: 201 })
}