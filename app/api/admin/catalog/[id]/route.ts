import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { forbiddenAdminResponse, requireAdminSession } from '@/lib/admin'
import { coverUrlSchema } from '@/lib/validations'
import { z } from 'zod'

const catalogUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Título obrigatório').max(200, 'Máximo de 200 caracteres'),
  author: z.string().trim().max(200, 'Máximo de 200 caracteres').nullable().optional(),
  coverUrl: coverUrlSchema,
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdminSession()
  if (!session) return forbiddenAdminResponse()

  const catalogEntry = await prisma.catalogManga.findUnique({ where: { id: params.id } })
  if (!catalogEntry) return NextResponse.json({ error: 'Obra não encontrada no catálogo.' }, { status: 404 })

  const parsed = catalogUpdateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const name = parsed.data.name
  const author = parsed.data.author?.trim() || null
  const coverUrl = parsed.data.coverUrl ?? null
  const normalizedName = name.toLocaleLowerCase('pt-BR')

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const entry = await tx.catalogManga.update({
        where: { id: catalogEntry.id },
        data: { name, author, coverUrl, normalizedName },
      })

      // Propaga título, autor e capa para todos os exemplares que os usuários
      // já têm na coleção deles, para não deixar cópias desatualizadas.
      await tx.manga.updateMany({
        where: { catalogId: catalogEntry.id },
        data: { name, author, coverUrl },
      })

      return entry
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe outra obra do catálogo com esse título e tipo.' }, { status: 409 })
    }
    console.error('Erro ao editar obra do catálogo:', error)
    return NextResponse.json({ error: 'Não foi possível salvar as alterações.' }, { status: 500 })
  }
}
