import { NextRequest, NextResponse } from 'next/server'

const ANILIST_URL = 'https://graphql.anilist.co'

const SEARCH_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        volumes
        status
        averageScore
        genres
        staff(perPage: 2) {
          edges {
            role
            node {
              name {
                full
              }
            }
          }
        }
      }
    }
  }
`

// Mapeia o status do AniList pro mesmo vocabulário que o Jikan usava,
// pra não quebrar nada que já dependa desses valores no front.
function mapStatus(status: string | null) {
  const map: Record<string, string> = {
    FINISHED: 'Finished',
    RELEASING: 'Publishing',
    NOT_YET_RELEASED: 'Not yet released',
    CANCELLED: 'Discontinued',
    HIATUS: 'On Hiatus',
  }
  return status ? map[status] ?? status : null
}

function pickAuthor(staff: any): string | null {
  const edges = staff?.edges ?? []
  // Prioriza quem assina a "Story" (roteiro); cai pro primeiro nome disponível
  const writer = edges.find((e: any) =>
    e.role?.toLowerCase().includes('story')
  )
  return writer?.node?.name?.full ?? edges[0]?.node?.name?.full ?? null
}

async function fetchAniList(search: string, perPage: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search, perPage },
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`AniList retornou ${res.status}: ${text}`)
    }

    return res
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query obrigatória' }, { status: 400 })
  }

  try {
    const res = await fetchAniList(query.trim(), 10)
    const json = await res.json()

    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message ?? 'Erro desconhecido do AniList')
    }

    const mangas = (json.data?.Page?.media ?? []).map((m: any) => ({
      // Nota: este é o ID do AniList, não o mal_id real do MyAnimeList.
      // Se algo no front usa esse valor pra montar link/consulta no MAL, precisa ajustar.
      mal_id: m.id,
      title: m.title?.english || m.title?.romaji,
      image: m.coverImage?.large ?? null,
      volumes: m.volumes ?? null,
      status: mapStatus(m.status),
      score: m.averageScore ? Number((m.averageScore / 10).toFixed(2)) : null,
      genre: m.genres?.[0] ?? null,
      author: pickAuthor(m.staff),
    }))

    return NextResponse.json({ mangas })
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('ERRO ANILIST:', details)

    return NextResponse.json(
      {
        error: 'Não foi possível pesquisar mangás no momento',
        details,
      },
      { status: 503 }
    )
  }
}