import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const mangas = await prisma.manga.findMany({
      where: {
        userId: userId,
        ...(status && { status: status as any }),
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(mangas)
  } catch (error) {
    console.error('Erro ao buscar mangás:', error)
    return NextResponse.json({ error: 'Erro ao buscar mangás' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, coverUrl, volume, totalVolumes, status, note, genre } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    // Evita duplicata (mesmo userId + name + volume)
    const existing = await prisma.manga.findUnique({
      where: { userId_name_volume: { userId: userId, name, volume: volume ?? 1 } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Manga já está na coleção' }, { status: 409 })
    }

    const manga = await prisma.manga.create({
      data: {
        name,
        coverUrl:     coverUrl ?? null,
        volume:       volume ?? 1,
        totalVolumes: totalVolumes ?? null,
        ownedVolumes: [],
        status:       status ?? 'WANT_TO_READ',
        note:         note ?? null,
        genre:        genre ?? null,
        userId:       userId,
      },
    })

    return NextResponse.json(manga, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mangá:', error)
    return NextResponse.json({ error: 'Erro ao criar mangá' }, { status: 500 })
  }
}
