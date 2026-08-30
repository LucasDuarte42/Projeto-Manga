import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUserSession } from '@/lib/session'
import { coverUrlSchema } from '@/lib/validations'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const request = await prisma.mangaRequest.findFirst({ where: { id: params.id, userId: session.user.id, status: 'PENDING' } })
  if (!request) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

  const body = await req.json()
  const parsedCover = coverUrlSchema.safeParse(body.coverUrl)
  if (!parsedCover.success || !parsedCover.data) return NextResponse.json({ error: 'Informe uma URL HTTPS válida para a capa.' }, { status: 400 })

  try {
    const manga = await prisma.$transaction(async (tx) => {
      const normalizedName = request.title.trim().toLocaleLowerCase('pt-BR')
      const catalog = await tx.catalogManga.upsert({
        where: { normalizedName_collectionType: { normalizedName, collectionType: request.collectionType } },
        update: { author: request.author, coverUrl: parsedCover.data, totalVolumes: request.totalVolumes },
        create: { name: request.title, normalizedName, author: request.author, coverUrl: parsedCover.data, totalVolumes: request.totalVolumes, collectionType: request.collectionType },
      })
      const created = await tx.manga.create({
        data: {
          name: request.title,
          author: request.author,
          coverUrl: parsedCover.data ?? null,
          totalVolumes: request.totalVolumes,
          volume: 1,
          status: null,
          isInWishlist: false,
          isFavorite: false,
          collectionType: request.collectionType,
          userId: session.user.id,
          catalogId: catalog.id,
        },
      })
      await tx.mangaRequest.update({ where: { id: request.id }, data: { coverUrl: parsedCover.data ?? null, status: 'APPROVED' } })
      return created
    })
    return NextResponse.json(manga, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Essa obra já está na sua coleção.' }, { status: 409 })
    }
    console.error('Erro ao confirmar solicitação:', error)
    return NextResponse.json({ error: 'Não foi possível confirmar a solicitação.' }, { status: 500 })
  }
}
