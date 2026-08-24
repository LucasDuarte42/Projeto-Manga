import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface VolumeRatingBody {
  volume?: unknown
  note?: unknown
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

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
    const session = await getServerSession(authOptions)

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
    const session = await getServerSession(authOptions)

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

    const body = (await req.json()) as VolumeRatingBody

    const parsedVolume = parseNumber(body.volume)
    const parsedNote = parseNumber(body.note)

    if (
      parsedVolume === null ||
      parsedVolume < 1 ||
      !Number.isInteger(parsedVolume)
    ) {
      return NextResponse.json(
        { error: 'Volume inválido' },
        { status: 400 }
      )
    }

    if (
      parsedNote === null ||
      parsedNote < 0 ||
      parsedNote > 10
    ) {
      return NextResponse.json(
        { error: 'Nota inválida' },
        { status: 400 }
      )
    }

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