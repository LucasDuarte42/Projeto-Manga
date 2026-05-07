import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query obrigatória' }, { status: 400 })
  }

  try {
    // Busca na Open Library (não precisa de chave)
    // q=query: busca geral
    // limit=10: limita resultados
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PinakesManga/1.0',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Open Library retornou ${res.status}` },
        { status: 500 }
      )
    }

    const data = await res.json()

    if (!data.docs) {
      return NextResponse.json({ comics: [] })
    }

    const comics = data.docs.map((doc: any, index: number) => ({
      mal_id:  doc.cover_i || index, // Usa cover_i como ID único ou o index
      title:   doc.title,
      image:   doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      volumes: doc.edition_count ?? null,
      status:  'Published',
      score:   null,
      genre:   doc.subject ? doc.subject[0] : null,
      author:  doc.author_name ? doc.author_name[0] : null,
    }))

    return NextResponse.json({ comics })
  } catch (err) {
    console.error('Fetch error:', err)
    return NextResponse.json({ error: 'Erro ao conectar com a Open Library' }, { status: 500 })
  }
}
