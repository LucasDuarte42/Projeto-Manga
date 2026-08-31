import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: { id: string; reviewId: string } }) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const review = await prisma.mangaReview.findFirst({ where: { id: params.reviewId, mangaId: params.id, userId: session.user.id } })
  if (!review) return NextResponse.json({ error: 'Review não encontrada' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  const rating = body.rating === null || body.rating === '' || body.rating === undefined ? null : Number(body.rating)
  if (!text || text.length > 5000) return NextResponse.json({ error: 'Escreva uma review de até 5.000 caracteres.' }, { status: 400 })
  if (rating !== null && (!Number.isFinite(rating) || rating < 0.5 || rating > 5)) return NextResponse.json({ error: 'A nota deve estar entre 0,5 e 5 estrelas.' }, { status: 400 })
  return NextResponse.json(await prisma.mangaReview.update({ where: { id: review.id }, data: { body: text, rating, containsSpoilers: Boolean(body.containsSpoilers) } }))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; reviewId: string } }) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const review = await prisma.mangaReview.findFirst({ where: { id: params.reviewId, mangaId: params.id, userId: session.user.id }, select: { id: true } })
  if (!review) return NextResponse.json({ error: 'Review não encontrada' }, { status: 404 })
  await prisma.mangaReview.delete({ where: { id: review.id } })
  return NextResponse.json({ ok: true })
}

export async function POST(_req: NextRequest, { params }: { params: { id: string; reviewId: string } }) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const review = await prisma.mangaReview.findFirst({ where: { id: params.reviewId, mangaId: params.id }, select: { id: true } })
  if (!review) return NextResponse.json({ error: 'Review não encontrada' }, { status: 404 })
  const existing = await prisma.reviewLike.findUnique({ where: { reviewId_userId: { reviewId: review.id, userId: session.user.id } } })
  if (existing) await prisma.reviewLike.delete({ where: { id: existing.id } })
  else await prisma.reviewLike.create({ data: { reviewId: review.id, userId: session.user.id } })
  return NextResponse.json({ liked: !existing })
}
