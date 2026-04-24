'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Manga {
  id: string
  title: string
  author?: string | null
  volume: number
  totalVolumes?: number | null
  status: 'READ' | 'READING' | 'WANT_TO_READ'
  note?: number | null
  coverImage?: string | null
  createdAt: string
}

export default function MangasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mangas, setMangas] = useState<Manga[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'READ' | 'READING' | 'WANT_TO_READ'>('ALL')

  // Redirecionar se não autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Buscar mangas
  useEffect(() => {
    if (status === 'authenticated') {
      fetchMangas()
    }
  }, [status])

  const fetchMangas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/mangas')
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar mangas: ${response.status}`)
      }
      
      const data = await response.json()
      setMangas(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao buscar mangas:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMangas = filterStatus === 'ALL' 
    ? mangas 
    : mangas.filter(m => m.status === filterStatus)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'READ': { label: 'Lido', color: 'bg-green-900 text-green-200' },
      'READING': { label: 'Lendo', color: 'bg-yellow-900 text-yellow-200' },
      'WANT_TO_READ': { label: 'Quero Ler', color: 'bg-blue-900 text-blue-200' },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? { ...config } : { label: status, color: 'bg-gray-900 text-gray-200' }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'READ': 'text-green-400',
      'READING': 'text-yellow-400',
      'WANT_TO_READ': 'text-blue-400',
    }
    return colors[status as keyof typeof colors] || 'text-gray-400'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando sua coleção...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition">
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-purple-400">Minha Coleção</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{session?.user?.name || session?.user?.email}</span>
          <Link href="/mangas/novo" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition">
            + Adicionar Manga
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Filtros */}
        <div className="mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'ALL'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todos ({mangas.length})
          </button>
          <button
            onClick={() => setFilterStatus('READ')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'READ'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Lidos ({mangas.filter(m => m.status === 'READ').length})
          </button>
          <button
            onClick={() => setFilterStatus('READING')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'READING'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Lendo ({mangas.filter(m => m.status === 'READING').length})
          </button>
          <button
            onClick={() => setFilterStatus('WANT_TO_READ')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'WANT_TO_READ'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Quero Ler ({mangas.filter(m => m.status === 'WANT_TO_READ').length})
          </button>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
            <p className="font-medium">Erro ao carregar coleção</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchMangas}
              className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Lista de mangas */}
        {filteredMangas.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-4">
              {mangas.length === 0 ? 'Sua coleção está vazia' : 'Nenhum manga nesta categoria'}
            </p>
            <Link href="/mangas/novo" className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition inline-block">
              Adicionar Primeiro Manga
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMangas.map((manga) => {
              const badge = getStatusBadge(manga.status)
              return (
                <Link
                  key={manga.id}
                  href={`/mangas/${manga.id}`}
                  className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-600 transition"
                >
                  {/* Cover Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-purple-900 to-gray-900 flex items-center justify-center group-hover:from-purple-800 transition">
                    {manga.coverImage ? (
                      <img
                        src={manga.coverImage}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center px-4">
                        <p className="text-gray-400 text-sm">Sem capa</p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                      {manga.title}
                    </h3>

                    {manga.author && (
                      <p className="text-gray-400 text-sm mb-3">Por {manga.author}</p>
                    )}

                    {/* Status Badge */}
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Volume Info */}
                    <div className="mb-3 text-sm text-gray-400">
                      <p>Volume: <span className="text-white font-medium">{manga.volume}</span>
                        {manga.totalVolumes && ` / ${manga.totalVolumes}`}
                      </p>
                    </div>

                    {/* Rating */}
                    {manga.note && (
                      <div className="text-sm">
                        <p className="text-gray-400">Nota: <span className="text-yellow-400 font-medium">{manga.note}/10</span></p>
                      </div>
                    )}

                    {/* Created Date */}
                    <p className="text-xs text-gray-500 mt-3">
                      Adicionado em {new Date(manga.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
