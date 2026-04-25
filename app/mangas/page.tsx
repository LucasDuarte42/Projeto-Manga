'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddMangaModal from '@/components/AddMangaModal'

// Campos alinhados com o schema Prisma
interface Manga {
  id:           string
  name:         string
  volume:       number
  totalVolumes?: number | null
  status:       'READ' | 'READING' | 'WANT_TO_READ'
  note?:        number | null
  coverUrl?:    string | null
  genre?:       string | null
  createdAt:    string
}

interface MangaResult {
  mal_id:  number
  title:   string
  image:   string | null
  volumes: number | null
  status:  string
  score:   number | null
  genre:   string | null
}

export default function MangasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mangas,       setMangas]       = useState<Manga[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'READ' | 'READING' | 'WANT_TO_READ'>('ALL')
  const [showModal,    setShowModal]    = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchMangas()
  }, [status])

  const fetchMangas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/mangas')

      console.log('Status:', response.status)

      if (!response.ok) throw new Error(`Erro ${response.status}`)

      const data = await response.json()

      console.log('Dados:', data)

      setMangas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao buscar mangas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(manga: MangaResult) {
    const res = await fetch('/api/mangas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         manga.title,
        coverUrl:     manga.image,
        totalVolumes: manga.volumes,
        volume:       1,
        status:       'WANT_TO_READ',
        genre:        manga.genre,
      }),
    })

    if (res.status === 409) {
      // Manga já existe — não fecha o modal, deixa o usuário ver o feedback no botão
      return
    }

    if (!res.ok) {
      throw new Error('Erro ao adicionar')
    }

    fetchMangas() // atualiza a lista em background
  }

  const filteredMangas = filterStatus === 'ALL'
    ? mangas
    : mangas.filter(m => m.status === filterStatus)

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'READ':         { label: 'Lido',      color: 'bg-green-900 text-green-200' },
      'READING':      { label: 'Lendo',     color: 'bg-yellow-900 text-yellow-200' },
      'WANT_TO_READ': { label: 'Quero Ler', color: 'bg-blue-900 text-blue-200' },
    }
    return map[status] ?? { label: status, color: 'bg-gray-900 text-gray-200' }
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
          <Link href="/" className="text-gray-400 hover:text-white transition">← Voltar</Link>
          <h1 className="text-xl font-bold text-purple-400">Minha Coleção</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{session?.user?.name || session?.user?.email}</span>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Adicionar Manga
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Filtros */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {[
            { key: 'ALL',          label: 'Todos',     count: mangas.length,                                          color: 'bg-purple-600' },
            { key: 'READ',         label: 'Lidos',     count: mangas.filter(m => m.status === 'READ').length,         color: 'bg-green-600'  },
            { key: 'READING',      label: 'Lendo',     count: mangas.filter(m => m.status === 'READING').length,      color: 'bg-yellow-600' },
            { key: 'WANT_TO_READ', label: 'Quero Ler', count: mangas.filter(m => m.status === 'WANT_TO_READ').length, color: 'bg-blue-600'   },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === key
                  ? `${color} text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Erro */}
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

        {/* Lista */}
        {filteredMangas.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-4">
              {mangas.length === 0 ? 'Sua coleção está vazia' : 'Nenhum manga nesta categoria'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition"
            >
              Adicionar Primeiro Manga
            </button>
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
                  {/* Capa */}
                  <div className="w-full h-48 bg-gradient-to-br from-purple-900 to-gray-900 flex items-center justify-center group-hover:from-purple-800 transition overflow-hidden">
                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
                        alt={manga.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <p className="text-gray-400 text-sm">Sem capa</p>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                      {manga.name}
                    </h3>

                    {manga.genre && (
                      <p className="text-purple-400 text-xs mb-2">{manga.genre}</p>
                    )}

                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="mb-3 text-sm text-gray-400">
                      <p>
                        Volume: <span className="text-white font-medium">{manga.volume}</span>
                        {manga.totalVolumes ? ` / ${manga.totalVolumes}` : ''}
                      </p>
                    </div>

                    {manga.note && (
                      <p className="text-sm text-gray-400">
                        Nota: <span className="text-yellow-400 font-medium">{manga.note}/10</span>
                      </p>
                    )}

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

      {/* Modal */}
      {showModal && (
        <AddMangaModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}