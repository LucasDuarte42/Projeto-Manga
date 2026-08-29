import { NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { featuredMangaSchema } from '@/lib/validations'

export async function PUT(req: Request) {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const parsed = featuredMangaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const mangas = await prisma.manga.findMany({
      where: { id: { in: parsed.data.mangaIds }, userId: session.user.id },
      select: { id: true },
    })
    if (mangas.length !== parsed.data.mangaIds.length) {
      return NextResponse.json({ error: 'Uma ou mais obras não pertencem à sua coleção.' }, { status: 400 })
    }

    const featuredMangaIds = parsed.data.mangaIds
    await prisma.user.update({ where: { id: session.user.id }, data: { featuredMangaIds } })
    return NextResponse.json({ featuredMangaIds })
  } catch (error) {
    console.error('Erro ao salvar destaques do perfil:', error)
    return NextResponse.json({ error: 'Não foi possível salvar os destaques.' }, { status: 500 })
  }
}
