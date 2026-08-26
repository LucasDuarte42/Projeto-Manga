import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const sessionMock = vi.hoisted(() => ({
  requireUserSession: vi.fn(),
}))

const prismaMock = vi.hoisted(() => ({
  manga: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  volumeRating: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
}))

vi.mock('@/lib/session', () => sessionMock)
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import { GET as getMangas, POST as createManga } from './route'
import {
  GET as getManga,
  PUT as updateManga,
  DELETE as deleteManga,
} from './[id]/route'
import {
  GET as getRatings,
  POST as createRating,
} from './[id]/volumes/route'

const userA = { user: { id: 'user-a', email: 'a@example.com' } }
const userB = { user: { id: 'user-b', email: 'b@example.com' } }

function request(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/mangas/manga-1', {
    method,
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { 'content-type': 'application/json' },
        }
      : {}),
  })
}

describe('autorização das APIs de mangás', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionMock.requireUserSession.mockResolvedValue(userA)
  })

  it('retorna 401 quando a sessão não existe', async () => {
    sessionMock.requireUserSession.mockResolvedValue(null)

    const response = await getMangas(request('GET'))

    expect(response.status).toBe(401)
    expect(prismaMock.manga.findMany).not.toHaveBeenCalled()
  })

  it('filtra a coleção pelo usuário autenticado', async () => {
    prismaMock.manga.findMany.mockResolvedValue([])
    prismaMock.manga.count.mockResolvedValue(0)

    const response = await getMangas(request('GET'))

    expect(prismaMock.manga.count).toHaveBeenCalledWith({
      where: { userId: 'user-a' },
    })
    expect(prismaMock.manga.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-a' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
      include: expect.objectContaining({
        volumes: expect.objectContaining({
          select: expect.objectContaining({ history: expect.anything() }),
        }),
      }),
    }))
    expect(await response.json()).toEqual({
      items: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    })
  })

  it('não permite consultar o mangá de outro usuário', async () => {
    prismaMock.manga.findUnique.mockResolvedValue({
      id: 'manga-1',
      userId: 'user-b',
    })

    const response = await getManga(request('GET'), { params: { id: 'manga-1' } })

    expect(response.status).toBe(404)
  })

  it('não permite editar o mangá de outro usuário', async () => {
    prismaMock.manga.findUnique.mockResolvedValue({
      id: 'manga-1',
      userId: 'user-b',
      ownedVolumes: [],
      volume: 1,
      totalVolumes: null,
      note: null,
      status: 'READING',
      name: 'Privado',
      author: null,
      genre: null,
      coverUrl: null,
    })

    const response = await updateManga(
      request('PUT', { name: 'Tentativa' }),
      { params: { id: 'manga-1' } }
    )

    expect(response.status).toBe(404)
    expect(prismaMock.manga.update).not.toHaveBeenCalled()
  })

  it('não permite excluir o mangá de outro usuário', async () => {
    prismaMock.manga.findUnique.mockResolvedValue({
      id: 'manga-1',
      userId: 'user-b',
    })

    const response = await deleteManga(
      request('DELETE'),
      { params: { id: 'manga-1' } }
    )

    expect(response.status).toBe(404)
    expect(prismaMock.manga.delete).not.toHaveBeenCalled()
  })

  it('não permite avaliar volumes de um mangá de outro usuário', async () => {
    prismaMock.manga.findUnique.mockResolvedValue({
      id: 'manga-1',
      userId: 'user-b',
    })

    const response = await createRating(
      request('POST', { volume: 1, note: 8 }),
      { params: { id: 'manga-1' } }
    )

    expect(response.status).toBe(404)
    expect(prismaMock.volumeRating.upsert).not.toHaveBeenCalled()
  })

  it('permite criar mangá usando o userId da sessão, nunca o corpo', async () => {
    prismaMock.manga.findUnique.mockResolvedValue(null)
    prismaMock.manga.create.mockResolvedValue({ id: 'manga-1', userId: 'user-a' })

    await createManga(
      request('POST', { name: 'Novo', userId: 'user-b' })
    )

    expect(prismaMock.manga.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-a' }),
      })
    )
  })
})

describe('autorização das APIs de avaliações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionMock.requireUserSession.mockResolvedValue(userA)
  })

  it('lista avaliações somente após validar a propriedade do mangá', async () => {
    prismaMock.manga.findUnique.mockResolvedValue({
      id: 'manga-1',
      userId: 'user-a',
    })
    prismaMock.volumeRating.findMany.mockResolvedValue([])

    const response = await getRatings(
      request('GET'),
      { params: { id: 'manga-1' } }
    )

    expect(response.status).toBe(200)
    expect(prismaMock.volumeRating.findMany).toHaveBeenCalledWith({
      where: { mangaId: 'manga-1' },
      orderBy: { volume: 'asc' },
    })
  })

  it('não acessa avaliações quando não há sessão', async () => {
    sessionMock.requireUserSession.mockResolvedValue(null)

    const response = await getRatings(
      request('GET'),
      { params: { id: 'manga-1' } }
    )

    expect(response.status).toBe(401)
    expect(prismaMock.volumeRating.findMany).not.toHaveBeenCalled()
  })
})
