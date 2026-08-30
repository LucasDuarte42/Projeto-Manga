import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserSession } from '@/lib/session'
import { searchQuerySchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = searchQuerySchema.safeParse({ q: new URL(req.url).searchParams.get('q') ?? '' })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const collectionType = new URL(req.url).searchParams.get('collectionType')
  const catalog = await prisma.catalogManga.findMany({
    where: {
      OR: [
        { name: { contains: parsed.data.q, mode: 'insensitive' } },
        { author: { contains: parsed.data.q, mode: 'insensitive' } },
      ],
      ...(collectionType === 'MANGA' || collectionType === 'HQ' ? { collectionType } : {}),
    },
    orderBy: { name: 'asc' },
    take: 50,
  })

  const owned = await prisma.manga.findMany({
    where: { userId: session.user.id, catalogId: { in: catalog.map((item) => item.id) } },
    select: { catalogId: true },
  })
  const ownedIds = new Set(owned.map((item) => item.catalogId))

  return NextResponse.json({ items: catalog.map((item) => ({
    mal_id: item.id,
    title: item.name,
    image: item.coverUrl,
    volumes: item.totalVolumes,
    status: '',
    score: null,
    genre: item.genre,
    author: item.author,
    collectionType: item.collectionType,
    inCollection: ownedIds.has(item.id),
  })) })
}
