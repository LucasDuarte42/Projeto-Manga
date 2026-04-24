import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const mangas = await prisma.manga.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(mangas)
  } catch (error) {
    console.error('Erro ao buscar mangas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mangas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const manga = await prisma.manga.create({
      data: {
        title: body.title,
        author: body.author,
        volume: body.volume || 1,
        totalVolumes: body.totalVolumes,
        status: body.status || 'WANT_TO_READ',
        note: body.note,
        coverImage: body.coverImage,
        userId: session.user.id,
      },
    })

    return NextResponse.json(manga, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar manga:', error)
    return NextResponse.json(
      { error: 'Erro ao criar manga' },
      { status: 500 }
    )
  }
}
