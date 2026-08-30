import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserSession } from '@/lib/session'
import { mangaRequestSchema } from '@/lib/validations'

export async function GET() {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const requests = await prisma.mangaRequest.findMany({
    where: { userId: session.user.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await requireUserSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = mangaRequestSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const request = await prisma.mangaRequest.create({
    data: {
      title: parsed.data.title,
      author: parsed.data.author ?? null,
      totalVolumes: parsed.data.totalVolumes ?? null,
      collectionType: parsed.data.collectionType,
      userId: session.user.id,
    },
  })
  return NextResponse.json(request, { status: 201 })
}
