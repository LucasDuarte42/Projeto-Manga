import { NextRequest, NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { volumeRatingSchema } from '@/lib/validations'

async function getUserManga(
  mangaId: string,
  userId: string
) {
  const manga = await prisma.manga.findUnique({
    where: {
      id: mangaId,
    },
  })

  if (!manga || manga.userId !== userId) {
    return null
  }

  return manga
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireUserSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const manga = await getUserManga(
      params.id,
      session.user.id
    )

    if (!manga) {
      return NextResponse.json(
        { error: 'Mangá não encontrado' },
        { status: 404 }
      )
    }

    const ratings = await prisma.volumeRating.findMany({
      where: {
        mangaId: params.id,
      },
      orderBy: {
        volume: 'asc',
      },
    })

    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireUserSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const manga = await getUserManga(
      params.id,
      session.user.id
    )

    if (!manga) {
      return NextResponse.json(
        { error: 'Mangá não encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const parsed = volumeRatingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { volume: parsedVolume, note: parsedNote } = parsed.data

    const rating = await prisma.volumeRating.upsert({
      where: {
        mangaId_volume: {
          mangaId: params.id,
          volume: parsedVolume,
        },
      },
      update: {
        note: parsedNote,
      },
      create: {
        mangaId: params.id,
        volume: parsedVolume,
        note: parsedNote,
      },
    })

    return NextResponse.json(rating)
  } catch (error) {
    console.error('Erro ao salvar avaliação:', error)

    return NextResponse.json(
      { error: 'Erro ao salvar avaliação' },
      { status: 500 }
    )
  }
}