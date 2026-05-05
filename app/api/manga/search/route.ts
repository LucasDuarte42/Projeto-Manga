import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query obrigatória' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          'User-Agent': 'PinakesManga/1.0',
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error('Jikan error:', res.status, text)
      return NextResponse.json(
        { error: `Jikan retornou ${res.status}` },
        { status: 500 }
      )
    }

    const data = await res.json()

    if (!data.data) {
      return NextResponse.json({ mangas: [] })
    }

    const mangas = data.data.map((m: any) => ({
  mal_id:  m.mal_id,
  title:   m.title,
  image:   m.images?.jpg?.image_url ?? null,
  volumes: m.volumes ?? null,
  status:  m.status,
  score:   m.score ?? null,
  genre:   m.genres?.[0]?.name ?? null,
  author:  m.authors?.[0]?.name ?? null,
}))

    return NextResponse.json({ mangas })
  } catch (err) {
    console.error('Fetch error:', err)
    return NextResponse.json({ error: 'Erro ao conectar com a API' }, { status: 500 })
  }
}