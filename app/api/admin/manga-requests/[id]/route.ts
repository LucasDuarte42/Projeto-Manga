import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { forbiddenAdminResponse, requireAdminSession } from '@/lib/admin'
import { coverUrlSchema } from '@/lib/validations'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession()
  if (!session) return forbiddenAdminResponse()

  const request = await prisma.mangaRequest.findUnique({ where: { id: params.id } })
  if (!request) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 })

  const body = await req.json()
  const action = body.action === 'APPROVE' || body.action === 'REJECT' ? body.action : null
  if (!action) return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })

  if (action === 'REJECT') {
    const updated = await prisma.mangaRequest.update({ where: { id: request.id }, data: { status: 'REJECTED' } })
    return NextResponse.json(updated)
  }

  const parsedCover = coverUrlSchema.safeParse(body.coverUrl)
  if (!parsedCover.success || !parsedCover.data) return NextResponse.json({ error: 'Informe uma URL HTTPS válida para a capa.' }, { status: 400 })

  try {
    const manga = await prisma.$transaction(async (tx) => {
      const created = await tx.manga.create({
        data: {
          name: request.title,
          author: request.author,
          coverUrl: parsedCover.data,
          totalVolumes: request.totalVolumes,
          volume: 1,
          status: null,
          isInWishlist: false,
          isFavorite: false,
          collectionType: request.collectionType,
          userId: request.userId,
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
