import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params

    // Busca o mangá pelo ID
    const manga = await prisma.manga.findUnique({
      where: { id },
    })

    if (!manga) {
      return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    }

    // Verifica se o mangá pertence ao usuário autenticado
    if (manga.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    return NextResponse.json(manga)
  } catch (error) {
    console.error('Erro ao buscar mangá:', error)
    return NextResponse.json({ error: 'Erro ao buscar mangá' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { name, coverUrl, volume, totalVolumes, ownedVolumes, status, note, genre } = body

    // Verifica se o mangá existe e pertence ao usuário
    const manga = await prisma.manga.findUnique({
      where: { id },
    })

    if (!manga) {
      return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    }

    if (manga.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Atualiza o mangá
    const updatedManga = await prisma.manga.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(volume !== undefined && { volume }),
        ...(totalVolumes !== undefined && { totalVolumes }),
        ...(ownedVolumes !== undefined && { ownedVolumes }),
        ...(status !== undefined && { status }),
        ...(note !== undefined && { note }),
        ...(genre !== undefined && { genre }),
      },
    })

    return NextResponse.json(updatedManga)
  } catch (error) {
    console.error('Erro ao atualizar mangá:', error)
    return NextResponse.json({ error: 'Erro ao atualizar mangá' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params

    // Verifica se o mangá existe e pertence ao usuário
    const manga = await prisma.manga.findUnique({
      where: { id },
    })

    if (!manga) {
      return NextResponse.json({ error: 'Mangá não encontrado' }, { status: 404 })
    }

    if (manga.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Deleta o mangá
    await prisma.manga.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Mangá removido com sucesso' }, { status: 200 })
  } catch (error) {
    console.error('Erro ao deletar mangá:', error)
    return NextResponse.json({ error: 'Erro ao deletar mangá' }, { status: 500 })
  }
}
