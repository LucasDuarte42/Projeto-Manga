import { NextRequest, NextResponse } from 'next/server'
import { requireUserSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireUserSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const manga = await prisma.manga.findUnique({
      where: { id: params.id },
      select: { userId: true, coverUrl: true },
    })

    if (!manga || manga.userId !== session.user.id || !manga.coverUrl) {
      return NextResponse.json({ error: 'Capa não encontrada' }, { status: 404 })
    }

    const coverUrl = new URL(manga.coverUrl)
    if (coverUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'URL de capa inválida' }, { status: 400 })
    }

    const response = await fetch(coverUrl, { headers: { Accept: 'image/*' }, cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ error: 'Não foi possível carregar a capa' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'O recurso não é uma imagem' }, { status: 415 })
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
        'Access-Control-Allow-Origin': 'same-origin',
      },
    })
  } catch (error) {
    console.error('Erro ao carregar capa para resumo:', error)
    return NextResponse.json({ error: 'Erro ao carregar capa' }, { status: 500 })
  }
}
