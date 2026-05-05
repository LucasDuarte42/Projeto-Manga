import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const ratings = await prisma.volumeRating.findMany({
    where: { mangaId: params.id },
    orderBy: { volume: 'asc' },
  })

  return NextResponse.json(ratings)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { volume, note } = await req.json()

  const rating = await prisma.volumeRating.upsert({
    where: { mangaId_volume: { mangaId: params.id, volume } },
    update: { note },
    create: { mangaId: params.id, volume, note },
  })

  return NextResponse.json(rating)
}