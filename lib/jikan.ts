// lib/jikan.ts - Funções para buscar dados da API Jikan

export interface JikanManga {
  mal_id: number
  title: string
  title_english: string | null
  title_synonyms: string[]
  status: string
  volumes: number | null
  chapters: number | null
  publishing: boolean
  published: {
    from: string
    to: string | null
  }
  score: number
  scored_by: number
  rank: number
  popularity: number
  members: number
  image_url: string
  large_image_url: string
  synopsis: string
  background: string
  authors: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  serializations: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  genres: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  explicit_genres: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  themes: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  demographics: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
}

export interface JikanSearchResult {
  data: JikanManga[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
  }
}

/**
 * Busca mangás na API Jikan pelo nome
 * @param query - Nome do mangá a buscar
 * @returns Array de mangás encontrados
 */
export async function searchMangaJikan(query: string): Promise<JikanManga[]> {
  if (!query.trim()) return []

  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/manga?query=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.statusText}`)
    }

    const data: JikanSearchResult = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Erro ao buscar na API Jikan:', error)
    return []
  }
}

/**
 * Busca detalhes de um mangá específico pelo ID
 * @param malId - ID do mangá no MyAnimeList
 * @returns Detalhes do mangá
 */
export async function getMangaDetailJikan(malId: number): Promise<JikanManga | null> {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/manga/${malId}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || null
  } catch (error) {
    console.error('Erro ao buscar detalhes na API Jikan:', error)
    return null
  }
}

/**
 * Formata informações do mangá para exibição
 */
export function formatMangaInfo(manga: JikanManga): string {
  const volumes = manga.volumes ? `${manga.volumes} volumes` : 'Volumes desconhecidos'
  const status = manga.status || 'Status desconhecido'
  return `${manga.title} - ${volumes} (${status})`
}
