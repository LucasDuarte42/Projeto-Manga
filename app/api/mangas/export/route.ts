import { NextRequest, NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  const session = await requireUserSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const format = new URL(req.url).searchParams.get('format')
  if (format !== 'json' && format !== 'csv') {
    return NextResponse.json({ error: 'Formato inválido. Use json ou csv.' }, { status: 400 })
  }

  const mangas = await prisma.manga.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      author: true,
      volume: true,
      totalVolumes: true,
      ownedVolumes: true,
      status: true,
      collectionType: true,
      note: true,
      genre: true,
      coverUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (format === 'json') {
    return new NextResponse(JSON.stringify(mangas, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pinakes-colecao.json"',
        'Cache-Control': 'no-store',
      },
    })
  }

  const headers = [
    'id', 'name', 'author', 'volume', 'totalVolumes', 'ownedVolumes',
    'status', 'collectionType', 'note', 'genre', 'coverUrl', 'createdAt', 'updatedAt',
  ]
  const rows = mangas.map((manga) => [
    manga.id, manga.name, manga.author, manga.volume, manga.totalVolumes,
    manga.ownedVolumes, manga.status, manga.collectionType, manga.note, manga.genre,
    manga.coverUrl, manga.createdAt.toISOString(), manga.updatedAt.toISOString(),
  ].map(csvCell).join(','))
  const csv = `\uFEFF${headers.join(',')}\n${rows.join('\n')}\n`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pinakes-colecao.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
