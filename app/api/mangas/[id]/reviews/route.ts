import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserSession } from '@/lib/session'

async function ownedManga(id: string, userId: string) {
  return prisma.manga.findFirst({ where: { id, userId }, select: { id: true } })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!await ownedManga(params.id, session.user.id)) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
  const reviews = await prisma.mangaReview.findMany({
    where: { mangaId: params.id },
    orderBy: [{ createdAt: 'desc' }],
    include: { user: { select: { id: true, name: true, avatarUrl: true } }, likes: { select: { userId: true } } },
  })
  return NextResponse.json({ reviews: reviews.map((review) => ({
    id: review.id, rating: review.rating, body: review.body, containsSpoilers: review.containsSpoilers,
    createdAt: review.createdAt, updatedAt: review.updatedAt, user: review.user,
    likes: review.likes.length, likedByMe: review.likes.some((like) => like.userId === session.user.id),
    isMine: review.userId === session.user.id,
  })) })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!await ownedManga(params.id, session.user.id)) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  const rating = body.rating === null || body.rating === '' || body.rating === undefined ? null : Number(body.rating)
  if (!text || text.length > 5000) return NextResponse.json({ error: 'Escreva uma review de até 5.000 caracteres.' }, { status: 400 })
  if (rating !== null && (!Number.isFinite(rating) || rating < 0.5 || rating > 5)) return NextResponse.json({ error: 'A nota deve estar entre 0,5 e 5 estrelas.' }, { status: 400 })
  const review = await prisma.mangaReview.upsert({
    where: { mangaId_userId: { mangaId: params.id, userId: session.user.id } },
    create: { mangaId: params.id, userId: session.user.id, body: text, rating, containsSpoilers: Boolean(body.containsSpoilers) },
    update: { body: text, rating, containsSpoilers: Boolean(body.containsSpoilers) },
  })
  return NextResponse.json(review, { status: 201 })
}
