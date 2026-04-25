import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar mangá por ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const manga = await prisma.manga.findUnique({
      where: { id: params.id },
    })

    if (!manga) {
      return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    }

    if (manga.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    return NextResponse.json(manga)
  } catch (error) {
    console.error('Erro ao buscar mangá:', error)
    return NextResponse.json({ error: 'Erro ao buscar mangá' }, { status: 500 })
  }
}

// DELETE - Deletar mangá
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const manga = await prisma.manga.findUnique({
      where: { id: params.id },
    })

    if (!manga) {
      return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    }

    if (manga.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    await prisma.manga.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar mangá:', error)
    return NextResponse.json({ error: 'Erro ao deletar mangá' }, { status: 500 })
  }
}

// PUT - Atualizar mangá
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const manga = await prisma.manga.findUnique({
      where: { id: params.id },
    })

    if (!manga) {
      return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    }

    if (manga.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    if (!body.volume || typeof body.volume !== 'number' || body.volume < 1) {
      return NextResponse.json({ error: 'Volume deve ser um número maior que 0' }, { status: 400 })
    }

    const statusValido = ['READ', 'READING', 'WANT_TO_READ'].includes(body.status)
    if (!statusValido) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    let note = null
    if (body.note !== undefined && body.note !== null && body.note !== '') {
      const noteNum = parseFloat(body.note)
      if (isNaN(noteNum) || noteNum < 0 || noteNum > 10) {
        return NextResponse.json({ error: 'Nota deve estar entre 0 e 10' }, { status: 400 })
      }
      note = noteNum
    }

    let totalVolumes = null
    if (body.totalVolumes !== undefined && body.totalVolumes !== null && body.totalVolumes !== '') {
      const total = parseInt(body.totalVolumes)
      if (isNaN(total) || total < body.volume) {
        return NextResponse.json({ error: 'Total de volumes deve ser válido' }, { status: 400 })
      }
      totalVolumes = total
    }

    const updated = await prisma.manga.update({
      where: { id: params.id },
      data: {
        name:         body.name.trim(),
        volume:       body.volume,
        totalVolumes: totalVolumes,
        status:       body.status,
        note:         note,
        genre:        body.genre    ? body.genre.trim()    : null,
        coverUrl:     body.coverUrl ? body.coverUrl.trim() : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar mangá:', error)
    return NextResponse.json({ error: 'Erro ao atualizar mangá' }, { status: 500 })
  }
}