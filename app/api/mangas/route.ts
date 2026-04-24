import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const manga = await prisma.manga.create({
      data: {
        name: body.name,
        volume: Number(body.volume),
        totalVolumes: body.totalVolumes
          ? Number(body.totalVolumes)
          : null,
        status: body.status,
        note: body.note
          ? Number(body.note)
          : null,
        coverUrl: body.coverUrl || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(manga)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Erro ao salvar mangá' },
      { status: 500 }
    )
  }
}