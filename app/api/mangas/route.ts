import { NextRequest, NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { mangaCreateSchema, mangaListQuerySchema } from '@/lib/validations'

function hasMissingVolumes(manga: { totalVolumes: number | null; ownedVolumes: number[] }) {
  return Boolean(manga.totalVolumes && manga.totalVolumes > manga.ownedVolumes.length)
}

function matchesProgress(manga: { status: string | null; totalVolumes: number | null; ownedVolumes: number[] }, progress: string) {
  if (progress === 'ALL') return true
  const owned = manga.ownedVolumes.length
  const total = manga.totalVolumes
  if (progress === 'COMPLETE') return manga.status === 'READ' || Boolean(total && owned >= total)
  if (progress === 'NOT_STARTED') return owned === 0 && (manga.status === null || manga.status === 'WANT_TO_READ')
  return manga.status === 'READING' || (owned > 0 && Boolean(total && owned < total))
}

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

  const { q, author, genre, status, collectionType, progress, volumes, sort, page, pageSize } = parsed.data
  const baseWhere = {
    userId: session.user.id,
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { author: { contains: q, mode: 'insensitive' as const } }] } : {}),
    ...(author ? { author: { contains: author, mode: 'insensitive' as const } } : {}),
    ...(genre ? { genre: { contains: genre, mode: 'insensitive' as const } } : {}),
    ...(collectionType !== 'ALL' ? { collectionType } : {}),
    ...(status !== 'ALL' && status !== 'MISSING' ? { status } : {}),
  }

  const orderBy = sort === 'AZ'
    ? { name: 'asc' as const }
    : sort === 'ZA'
      ? { name: 'desc' as const }
      : { createdAt: 'desc' as const }

  const requiresMemoryFiltering = status === 'MISSING' || progress !== 'ALL' || volumes !== 'ALL'

  if (requiresMemoryFiltering) {
    const candidates = await prisma.manga.findMany({ where: baseWhere, orderBy })
    const filtered = candidates.filter((manga) => {
      const missing = hasMissingVolumes(manga)
      const matchesVolumeFilter = volumes === 'ALL' || (volumes === 'MISSING' ? missing : !missing)
      const matchesStatusFilter = status !== 'MISSING' || missing
      return matchesStatusFilter && matchesVolumeFilter && matchesProgress(manga, progress)
    })
    const totalItems = filtered.length
    const items = filtered.slice((page - 1) * pageSize, page * pageSize)
    return NextResponse.json({
      items,
      pagination: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
    })
  }

  const [totalItems, items] = await Promise.all([
    prisma.manga.count({ where: baseWhere }),
    prisma.manga.findMany({ where: baseWhere, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  return NextResponse.json({
    items,
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
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, author, coverUrl, volume, totalVolumes, status, isInWishlist, isFavorite, note, genre, collectionType } = parsed.data
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
      status: status ?? null,
      isInWishlist: isInWishlist ?? false,
      isFavorite: isFavorite ?? false,
      note: note ?? null,
      genre: genre ?? null,
      collectionType: collectionType ?? 'MANGA',
      userId: session.user.id,
    },
  })

  return NextResponse.json(manga, { status: 201 })
}
