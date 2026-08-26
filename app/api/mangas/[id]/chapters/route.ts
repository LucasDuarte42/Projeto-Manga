import { NextRequest, NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { chapterRatingSchema } from '@/lib/validations'

async function getUserManga(mangaId: string, userId: string) {
  const manga = await prisma.manga.findUnique({ where: { id: mangaId } })
  return manga && manga.userId === userId ? manga : null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const manga = await getUserManga(params.id, session.user.id)
    if (!manga) return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    const ratings = await prisma.chapterRating.findMany({ where: { mangaId: params.id }, orderBy: { chapter: 'asc' } })
    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Erro ao buscar avaliações de capítulos:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações de capítulos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const manga = await getUserManga(params.id, session.user.id)
    if (!manga) return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    const parsed = chapterRatingSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    if (!manga.readChapters.includes(parsed.data.chapter)) {
      return NextResponse.json({ error: 'Avalie apenas capítulos marcados como lidos' }, { status: 400 })
    }
    const rating = await prisma.chapterRating.upsert({
      where: { mangaId_chapter: { mangaId: params.id, chapter: parsed.data.chapter } },
      update: { note: parsed.data.note },
      create: { mangaId: params.id, chapter: parsed.data.chapter, note: parsed.data.note },
    })
    return NextResponse.json(rating)
  } catch (error) {
    console.error('Erro ao salvar avaliação de capítulo:', error)
    return NextResponse.json({ error: 'Erro ao salvar avaliação de capítulo' }, { status: 500 })
  }
}
