import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireUserSession } from '@/lib/session'
import { isAdminEmail } from '@/lib/admin-email'
import { prisma } from '@/lib/prisma'
import { mangaUpdateSchema } from '@/lib/validations'

type MangaStatus = 'READ' | 'READING' | 'WANT_TO_READ'
type NullableMangaStatus = MangaStatus | null

interface UpdateMangaBody {
  name?: unknown
  author?: unknown
  volume?: unknown
  totalVolumes?: unknown
  totalChapters?: unknown
  readChapters?: unknown
  ownedVolumes?: unknown
  status?: unknown
  isInWishlist?: unknown
  isFavorite?: unknown
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

function parseChapterList(value: unknown, totalChapters: number | null): number[] {
  if (!Array.isArray(value)) return []

  const chapters = value
    .map((item) => parseNumber(item))
    .filter((item): item is number => item !== null)
    .map((item) => Math.floor(item))
    .filter((item) => item > 0 && (totalChapters === null || item <= totalChapters))

  return chapters.filter((chapter, index, array) => array.indexOf(chapter) === index).sort((a, b) => a - b)
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
      (volume, index, array) =>
        array.indexOf(volume) === index
    )
    .sort((a, b) => a - b)
}

function parseStatus(value: unknown): NullableMangaStatus {
  if (
    value === 'READ' ||
    value === 'READING' ||
    value === 'WANT_TO_READ'
  ) {
    return value
  }

  return null
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
    const session = await requireUserSession()

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

    const rawBody = await req.json()
    const parsedBody = mangaUpdateSchema.safeParse(rawBody)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0].message },
        { status: 400 }
      )
    }

    const body = parsedBody.data as UpdateMangaBody
    const isAdmin = isAdminEmail(session.user.email)

    const ownedVolumes = parseOwnedVolumes(
      body.ownedVolumes ?? manga.ownedVolumes
    )

    const parsedTotalVolumes = parseNumber(
      body.totalVolumes
    )

    const totalVolumes =
      parsedTotalVolumes !== null
        ? Math.max(
            1,
            Math.floor(parsedTotalVolumes)
          )
        : null

    const parsedTotalChapters = parseNumber(body.totalChapters)
    const totalChapters = parsedTotalChapters !== null
      ? Math.max(1, Math.floor(parsedTotalChapters))
      : body.totalChapters === null
        ? null
        : manga.totalChapters

    const readChapters = body.readChapters !== undefined
      ? parseChapterList(body.readChapters, totalChapters)
      : manga.readChapters

    const parsedNote = body.note === undefined
      ? manga.note
      : parseNumber(body.note)

    const note = parsedNote === null
      ? null
      : Math.min(10, Math.max(0, parsedNote))

    const parsedVolume = parseNumber(body.volume)

    const volume =
      parsedVolume !== null
        ? Math.max(
            0,
            Math.floor(parsedVolume)
          )
        : ownedVolumes.length > 0
          ? Math.max(...ownedVolumes)
          : manga.volume

    const status: NullableMangaStatus = body.status === null
      ? null
      : parseStatus(body.status ?? manga.status)

    // Título e autor só podem ser alterados pelo administrador. Um usuário
    // comum pode enviar esses campos (ex.: o formulário reenvia o valor atual),
    // mas qualquer tentativa de mudança é ignorada silenciosamente.
    const name =
      isAdmin &&
      typeof body.name === 'string' &&
      body.name.trim()
        ? body.name.trim()
        : manga.name

    const author =
      isAdmin && typeof body.author === 'string'
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

    const isInWishlist = body.status !== undefined
      ? body.status === 'WANT_TO_READ'
        ? true
        : body.isInWishlist ?? false
      : body.isInWishlist ?? manga.isInWishlist

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
        totalChapters,
        readChapters,
        status,
        isInWishlist,
        isFavorite: body.isFavorite ?? manga.isFavorite,
        note,
        genre,
        coverUrl,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar mangá:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2021' || error.code === 'P2022')) {
      return NextResponse.json(
        { error: 'O banco ainda não recebeu a migration de capítulos. Execute: npx prisma migrate deploy' },
        { status: 503 }
      )
    }

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
    const session = await requireUserSession()

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
    console.error(
      'Erro ao deletar mangá:',
      error
    )

    return NextResponse.json(
      { error: 'Erro ao deletar mangá' },
      { status: 500 }
    )
  }
}