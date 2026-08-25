import { NextRequest, NextResponse } from 'next/server'
import { searchQuerySchema } from '@/lib/validations'

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
export async function GET(req: NextRequest) {
  try {
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

    const search = parsedQuery.data.q

    const response = await fetch(ANILIST_API, {
      method: 'POST',
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
      console.error(
        'Erro AniList:',
        response.status,
        await response.text()
      )

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
    console.error('Erro /api/manga-search:', error)

    return NextResponse.json(
      { error: 'Erro interno ao buscar mangás' },
      { status: 500 }
    )
  }
}