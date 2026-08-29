import { NextRequest, NextResponse } from 'next/server'
import { searchQuerySchema } from '@/lib/validations'
import { consumeRateLimit, getClientIp } from '@/lib/security'

const ANILIST_API = 'https://graphql.anilist.co'

const query = `
  query ($search: String!) {
    Page(page: 1, perPage: 10) {
      media(
        search: $search
        type: MANGA
        sort: SEARCH_MATCH
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        volumes
        status
        averageScore
        genres
        format
      }
    }
  }
`
export const dynamic = 'force-dynamic'

const UPSTREAM_TIMEOUT_MS = 8_000
const SEARCH_LIMIT = 30
const SEARCH_WINDOW_MS = 10 * 60 * 1000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsedQuery = searchQuerySchema.safeParse({
    q: searchParams.get('q') ?? '',
  })

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues[0].message },
      { status: 400 }
    )
  }

  const clientIp = getClientIp(req.headers)
  const allowed = await consumeRateLimit(
    `external-search:mangas:${clientIp}`,
    SEARCH_LIMIT,
    SEARCH_WINDOW_MS
  )

  if (!allowed) {
    return NextResponse.json(
      { error: 'Limite de buscas atingido. Tente novamente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(SEARCH_WINDOW_MS / 1000) } }
    )
  }

  const search = parsedQuery.data.q
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          search,
        },
      }),
      next: {
        revalidate: 60,
      },
    })

    if (!response.ok) {
      console.error('AniList retornou status HTTP', response.status)
      return NextResponse.json(
        { error: 'Erro ao buscar na API AniList' },
        { status: 502 }
      )
    }

    const result = await response.json()

    if (result.errors) {
      console.error('AniList GraphQL:', result.errors)

      return NextResponse.json(
        { error: 'Erro na consulta da AniList' },
        { status: 502 }
      )
    }

    const mangas = result.data?.Page?.media ?? []

    const formattedMangas = mangas.map((manga: any) => ({
      mal_id: manga.id,
      title:
        manga.title?.english ||
        manga.title?.romaji ||
        manga.title?.native ||
        'Sem título',
      image:
        manga.coverImage?.large ||
        manga.coverImage?.medium ||
        null,
      volumes: manga.volumes ?? null,
      status: manga.status ?? null,
      score:
        manga.averageScore !== null &&
        manga.averageScore !== undefined
          ? manga.averageScore / 10
          : null,
      genre: manga.genres?.[0] ?? null,
      genres: manga.genres ?? [],
      format: manga.format ?? null,
    }))

    return NextResponse.json({
      mangas: formattedMangas,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'A busca demorou demais. Tente novamente.' },
        { status: 504 }
      )
    }

    console.error('Erro /api/mangas/search:', error instanceof Error ? error.message : 'erro desconhecido')
    return NextResponse.json(
      { error: 'Não foi possível buscar mangás no momento' },
      { status: 503 }
    )
  } finally {
    clearTimeout(timeout)
  }
}