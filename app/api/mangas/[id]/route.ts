import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type MangaStatus = 'READ' | 'READING' | 'WANT_TO_READ'

interface UpdateMangaBody {
  name?: unknown
  author?: unknown
  volume?: unknown
  totalVolumes?: unknown
  ownedVolumes?: unknown
  status?: unknown
  note?: unknown
  genre?: unknown
  coverUrl?: unknown
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

function parseOwnedVolumes(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  const volumes = value
    .map((item) => parseNumber(item))
    .filter((item): item is number => item !== null)
    .map((item) => Math.floor(item))
    .filter((item) => item > 0)

  return volumes
    .filter(
      (volume, index, array) => array.indexOf(volume) === index
    )
    .sort((a, b) => a - b)
}

function parseStatus(value: unknown): MangaStatus {
  if (
    value === 'READ' ||
    value === 'READING' ||
    value === 'WANT_TO_READ'
  ) {
    return value
  }

  return 'WANT_TO_READ'
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

    const manga = await prisma.manga.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!manga || manga.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Mangá não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(manga)
  } catch (error) {
    console.error('Erro ao buscar mangá:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar mangá' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const manga = await prisma.manga.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!manga || manga.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Mangá não encontrado' },
        { status: 404 }
      )
    }

    const body = (await req.json()) as UpdateMangaBody

    const ownedVolumes = parseOwnedVolumes(
      body.ownedVolumes ?? manga.ownedVolumes
    )

    const parsedTotalVolumes = parseNumber(body.totalVolumes)

    const totalVolumes =
      parsedTotalVolumes !== null
        ? Math.max(1, Math.floor(parsedTotalVolumes))
        : null

    const parsedNote = parseNumber(body.note)

    let note: number | null = null

    if (parsedNote !== null) {
      note = Math.min(10, Math.max(0, parsedNote))
    }

    const parsedVolume = parseNumber(body.volume)

    const volume =
      parsedVolume !== null
        ? Math.max(0, Math.floor(parsedVolume))
        : ownedVolumes.length > 0
          ? Math.max(...ownedVolumes)
          : manga.volume

    let status = parseStatus(body.status ?? manga.status)

    // Se existe uma nota geral, a obra é considerada lida
    if (note !== null) {
      status = 'READ'
    }

    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : manga.name

    const author =
      typeof body.author === 'string'
        ? body.author.trim() || null
        : manga.author

    const genre =
      typeof body.genre === 'string'
        ? body.genre.trim() || null
        : manga.genre

    const coverUrl =
      typeof body.coverUrl === 'string'
        ? body.coverUrl.trim() || null
        : manga.coverUrl

    const updated = await prisma.manga.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        author,
        volume,
        totalVolumes,
        ownedVolumes,
        status,
        note,
        genre,
        coverUrl,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar mangá:', error)

    return NextResponse.json(
      { error: 'Erro ao atualizar mangá' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const manga = await prisma.manga.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!manga || manga.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Mangá não encontrado' },
        { status: 404 }
      )
    }

    await prisma.manga.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Erro ao deletar mangá:', error)

    return NextResponse.json(
      { error: 'Erro ao deletar mangá' },
      { status: 500 }
    )
  }
}