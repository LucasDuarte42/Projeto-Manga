import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { forbiddenAdminResponse, requireAdminSession } from '@/lib/admin'
import { coverUrlSchema, mangaRequestSchema } from '@/lib/validations'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession()
  if (!session) return forbiddenAdminResponse()

  const request = await prisma.mangaRequest.findUnique({ where: { id: params.id } })
  if (!request) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 })

  const body = await req.json()
  const action = body.action === 'APPROVE' || body.action === 'REJECT' ? body.action : null
  if (!action) return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })

  const parsedRequest = mangaRequestSchema.safeParse({
    title: body.title ?? request.title,
    author: body.author === undefined ? request.author : body.author,
    totalVolumes: body.totalVolumes === undefined ? request.totalVolumes : body.totalVolumes,
    collectionType: body.collectionType ?? request.collectionType,
  })
  if (!parsedRequest.success) return NextResponse.json({ error: parsedRequest.error.issues[0].message }, { status: 400 })

  const editedRequest = await prisma.mangaRequest.update({
    where: { id: request.id },
    data: { ...parsedRequest.data, author: parsedRequest.data.author ?? null, totalVolumes: parsedRequest.data.totalVolumes ?? null },
  })

  if (action === 'REJECT') {
    const updated = await prisma.mangaRequest.update({ where: { id: request.id }, data: { status: 'REJECTED' } })
    return NextResponse.json(updated)
  }

  const parsedCover = coverUrlSchema.safeParse(body.coverUrl)
  if (!parsedCover.success || !parsedCover.data) return NextResponse.json({ error: 'Informe uma URL HTTPS válida para a capa.' }, { status: 400 })

  try {
    const manga = await prisma.$transaction(async (tx) => {
      const normalizedName = editedRequest.title.trim().toLocaleLowerCase('pt-BR')
      const catalog = await tx.catalogManga.upsert({
        where: { normalizedName_collectionType: { normalizedName, collectionType: editedRequest.collectionType } },
        update: { author: editedRequest.author, coverUrl: parsedCover.data, totalVolumes: editedRequest.totalVolumes },
        create: { name: editedRequest.title, normalizedName, author: editedRequest.author, coverUrl: parsedCover.data, totalVolumes: editedRequest.totalVolumes, collectionType: editedRequest.collectionType },
      })
      const created = await tx.manga.create({
        data: {
          name: editedRequest.title,
          author: editedRequest.author,
          coverUrl: parsedCover.data,
          totalVolumes: editedRequest.totalVolumes,
          volume: 1,
          status: null,
          isInWishlist: false,
          isFavorite: false,
          collectionType: editedRequest.collectionType,
          userId: request.userId,
          catalogId: catalog.id,
        },
      })
      await tx.mangaRequest.update({ where: { id: request.id }, data: { coverUrl: parsedCover.data, status: 'APPROVED' } })
      return created
    })
    return NextResponse.json(manga, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ error: 'Essa obra já existe na coleção do solicitante.' }, { status: 409 })
    console.error('Erro ao aprovar solicitação:', error)
    return NextResponse.json({ error: 'Não foi possível aprovar a solicitação.' }, { status: 500 })
  }
}
