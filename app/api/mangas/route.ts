import { NextRequest, NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { mangaCreateSchema, mangaListQuerySchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const session = await requireUserSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = mangaListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { q, status, sort, page, pageSize } = parsed.data
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const volumeReadInclude = {
    volumes: {
      select: {
        history: {
          where: {
            toStatus: 'READ' as const,
            changedAt: { gte: monthStart },
          },
          select: { changedAt: true },
        },
      },
    },
  }
  const withReadStats = (items: Array<{ volumes: Array<{ history: Array<{ changedAt: Date }> }> }>) => items.map((item) => {
    const readDates = item.volumes.flatMap((volume) => volume.history.map((entry) => entry.changedAt))
    return {
      ...item,
      readThisWeek: readDates.filter((date) => date >= weekStart).length,
      readThisMonth: readDates.length,
      volumes: undefined,
    }
  })

  const baseWhere = {
    userId: session.user.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { author: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const orderBy = sort === 'AZ'
    ? { name: 'asc' as const }
    : sort === 'ZA'
      ? { name: 'desc' as const }
      : { createdAt: 'desc' as const }

  if (status === 'MISSING') {
    const candidates = await prisma.manga.findMany({
      where: { ...baseWhere, totalVolumes: { gt: 0 } },
      orderBy,
      include: volumeReadInclude,
    })
    const missing = candidates.filter((manga) => manga.ownedVolumes.length < (manga.totalVolumes ?? 0))
    const totalItems = missing.length
    const items = missing.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      items: withReadStats(items),
      pagination: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
    })
  }

  const where = status === 'ALL' ? baseWhere : { ...baseWhere, status }
  const [totalItems, items] = await Promise.all([
    prisma.manga.count({ where }),
    prisma.manga.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: volumeReadInclude }),
  ])

  return NextResponse.json({
    items: withReadStats(items),
    pagination: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
  })
}

export async function POST(req: NextRequest) {
  const session = await requireUserSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = mangaCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name, author, coverUrl, volume, totalVolumes, status, note, genre, collectionType } = parsed.data

  const existing = await prisma.manga.findUnique({
    where: { userId_name_volume: { userId: session.user.id, name, volume: volume ?? 1 } },
  })

  if (existing) {
    return NextResponse.json({ error: 'Manga já está na coleção' }, { status: 409 })
  }

  const manga = await prisma.manga.create({
    data: {
      name,
      author: author ?? null,
      coverUrl: coverUrl ?? null,
      volume: volume ?? 1,
      totalVolumes: totalVolumes ?? null,
      status: status ?? 'WANT_TO_READ',
      note: note ?? null,
      genre: genre ?? null,
      collectionType: collectionType ?? 'MANGA',
      userId: session.user.id,
    },
  })

  return NextResponse.json(manga, { status: 201 })
}
