import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query obrigatória' }, { status: 400 })
  }

  const res = await fetch(
    `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=10`,
    { next: { revalidate: 60 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Erro ao buscar na API' }, { status: 500 })
  }

  const data = await res.json()

  const mangas = data.data.map((m: any) => ({
    mal_id:  m.mal_id,
    title:   m.title,
    image:   m.images?.jpg?.image_url ?? null,
    volumes: m.volumes ?? null,
    status:  m.status,
    score:   m.score ?? null,
    genre:   m.genres?.[0]?.name ?? null,
  }))

  return NextResponse.json({ mangas })
}