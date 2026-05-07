import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const apiKey = process.env.COMIC_VINE_API_KEY

  if (!query) {
    return NextResponse.json({ error: 'Query obrigatória' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'Chave da API Comic Vine não configurada no .env' }, { status: 500 })
  }

  try {
    // Comic Vine API URL para busca de volumes (séries)
    // resources=volume foca em séries/volumes em vez de edições individuais
    const url = `https://comicvine.gamespot.com/api/search/?api_key=${apiKey}&format=json&query=${encodeURIComponent(query)}&resources=volume&limit=10`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PinakesManga/1.0',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Comic Vine retornou ${res.status}` },
        { status: 500 }
      )
    }

    const data = await res.json()

    if (!data.results) {
      return NextResponse.json({ comics: [] })
    }

    const comics = data.results.map((c: any) => ({
      mal_id:  c.id, // Usando o id da Comic Vine como mal_id para manter compatibilidade na UI
      title:   c.name,
      image:   c.image?.medium_url ?? c.image?.original_url ?? null,
      volumes: c.count_of_issues ?? null,
      status:  'Publishing', // Comic Vine não tem um status direto como o Jikan
      score:   null,
      genre:   c.publisher?.name ?? null, // Usando a editora como "gênero" para contexto
      author:  null, // Comic Vine busca volumes, autores costumam estar nas edições
    }))

    return NextResponse.json({ comics })
  } catch (err) {
    console.error('Fetch error:', err)
    return NextResponse.json({ error: 'Erro ao conectar com a API Comic Vine' }, { status: 500 })
  }
}
