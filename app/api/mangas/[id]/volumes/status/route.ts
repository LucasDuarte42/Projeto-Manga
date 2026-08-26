import { NextRequest, NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { volumeStatusSchema } from '@/lib/validations'

async function getUserManga(mangaId: string, userId: string) {
  const manga = await prisma.manga.findUnique({ where: { id: mangaId } })
  return manga && manga.userId === userId ? manga : null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const manga = await getUserManga(params.id, session.user.id)
  if (!manga) return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })

  const saved = await prisma.mangaVolume.findMany({
    where: { mangaId: params.id },
    include: { history: { orderBy: { changedAt: 'desc' }, take: 20 } },
    orderBy: { number: 'asc' },
  })
  const savedByNumber = new Map(saved.map((volume) => [volume.number, volume]))
  const knownNumbers = new Set(saved.map((volume) => volume.number))
  const maxVolume = Math.max(manga.totalVolumes ?? 0, manga.volume, ...manga.ownedVolumes, 0)

  const volumes = Array.from({ length: maxVolume }, (_, index) => {
    const number = index + 1
    const existing = savedByNumber.get(number)
    if (existing) return existing
    return {
      id: `legacy-${params.id}-${number}`,
      mangaId: params.id,
      number,
      status: manga.ownedVolumes.includes(number) ? 'OWNED' : 'MISSING',
      loanedTo: null,
      loanedAt: null,
      dueDate: null,
      createdAt: manga.createdAt,
      updatedAt: manga.updatedAt,
      history: [],
    }
  })

  return NextResponse.json({ volumes, total: volumes.length, persistedCount: knownNumbers.size })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const manga = await getUserManga(params.id, session.user.id)
  if (!manga) return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })

  const parsed = volumeStatusSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { volume: number, status, loanedTo, dueDate } = parsed.data
  if (manga.totalVolumes !== null && number > manga.totalVolumes) {
    return NextResponse.json({ error: 'Esse volume está fora do total cadastrado' }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const previous = await tx.mangaVolume.findUnique({ where: { mangaId_number: { mangaId: params.id, number } } })
    const changed = !previous || previous.status !== status || previous.loanedTo !== (loanedTo ?? null) || previous.dueDate?.toISOString() !== (dueDate ? new Date(dueDate).toISOString() : undefined)
    const updated = await tx.mangaVolume.upsert({
      where: { mangaId_number: { mangaId: params.id, number } },
      update: {
        status,
        loanedTo: status === 'LOANED' ? loanedTo ?? null : null,
        loanedAt: status === 'LOANED' ? previous?.loanedAt ?? new Date() : null,
        dueDate: status === 'LOANED' && dueDate ? new Date(dueDate) : null,
      },
      create: {
        mangaId: params.id,
        number,
        status,
        loanedTo: status === 'LOANED' ? loanedTo ?? null : null,
        loanedAt: status === 'LOANED' ? new Date() : null,
        dueDate: status === 'LOANED' && dueDate ? new Date(dueDate) : null,
      },
    })

    if (changed) {
      await tx.volumeHistory.create({
        data: {
          volumeId: updated.id,
          fromStatus: previous?.status ?? null,
          toStatus: status,
          loanedTo: updated.loanedTo,
          dueDate: updated.dueDate,
        },
      })
    }

    const ownedVolumes = await tx.mangaVolume.findMany({ where: { mangaId: params.id, status: { not: 'MISSING' } }, select: { number: true } })
    await tx.manga.update({ where: { id: params.id }, data: { ownedVolumes: ownedVolumes.map((item) => item.number) } })
    return updated
  })

  return NextResponse.json(result)
}
