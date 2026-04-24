'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Manga = {
  id: string
  name: string
  volume: number
  status: 'READ' | 'READING' | 'WANT_TO_READ'
  genre: string | null
  note: number | null
  coverUrl: string | null
}

type JikanResult = {
  mal_id: number
  title: string
  volumes: number | null
  genres: { name: string }[]
  images: { jpg: { image_url: string } }
}

const statusLabel = {
  READ: 'Lido',
  READING: 'Lendo',
  WANT_TO_READ: 'Quero Ler',
}

const statusColor = {
  READ: 'text-green-400 bg-green-400/10',
  READING: 'text-yellow-400 bg-yellow-400/10',
  WANT_TO_READ: 'text-blue-400 bg-blue-400/10',
}

export default function MangasPage() {
  const [mangas, setMangas] = useState<Manga[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: '', volume: '', status: 'WANT_TO_READ', genre: '', note: '', coverUrl: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [jikanQuery, setJikanQuery] = useState('')
  const [jikanResults, setJikanResults] = useState<JikanResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout>()

  async function fetchMangas() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const res = await fetch(`/api/mangas?${params}`)
    const data = await res.json()
    setMangas(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMangas()
  }, [search, status])

  useEffect(() => {
    if (!jikanQuery || jikanQuery.length < 2) {
      setJikanResults([])
      return
    }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(jikanQuery)}&limit=5`)
        const data = await res.json()
        setJikanResults(data.data || [])
      } catch {
        setJikanResults([])
      }
      setSearching(false)
    }, 600)
  }, [jikanQuery])

  function selectJikanManga(item: JikanResult) {
    setForm({
      name: item.title,
      volume: item.volumes ? String(item.volumes) : '',
      status: 'WANT_TO_READ',
      genre: item.genres?.map(g => g.name).join(', ') || '',
      note: '',
      coverUrl: item.images?.jpg?.image_url || '',
    })
    setJikanResults([])
    setJikanQuery('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/mangas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao salvar')
      setSaving(false)
      return
    }

    setForm({ name: '', volume: '', status: 'WANT_TO_READ', genre: '', note: '', coverUrl: '' })
    setShowForm(false)
    setSaving(false)
    fetchMangas()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar este mangá?')) return
    await fetch(`/api/mangas/${id}`, { method: 'DELETE' })
    fetchMangas()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-purple-400">Pinakes Mangá</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">
            Dashboard
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Adicionar
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">Minha Coleção</h2>

        <div className="flex gap-3 mb-8 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 flex-1 min-w-48"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Todos os status</option>
            <option value="READ">Lido</option>
            <option value="READING">Lendo</option>
            <option value="WANT_TO_READ">Quero Ler</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : mangas.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-4">Nenhum mangá encontrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition"
            >
              Adicionar mangá
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {mangas.map(manga => (
              <div key={manga.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                {manga.coverUrl ? (
                  <img
                    src={manga.coverUrl}
                    alt={manga.name}
                    className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-20 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-600 text-xs text-center">
                    Sem capa
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{manga.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[manga.status]}`}>
                      {statusLabel[manga.status]}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>Vol. {manga.volume}</span>
                    {manga.genre && <span>{manga.genre}</span>}
                    {manga.note && <span>Nota: {manga.note}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(manga.id)}
                  className="text-gray-500 hover:text-red-400 transition text-sm"
                >
                  Deletar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Adicionar Mangá</h3>

            {/* Busca Jikan */}
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-1 block">Buscar na API MyAnimeList</label>
              <div className="relative">
                <input
                  type="text"
                  value={jikanQuery}
                  onChange={e => setJikanQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-purple-500 focus:outline-none"
                  placeholder="Digite o nome do mangá..."
                />
                {searching && (
                  <p className="text-xs text-gray-400 mt-1">Buscando...</p>
                )}
                {jikanResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 z-10 overflow-hidden">
                    {jikanResults.map(item => (
                      <button
                        key={item.mal_id}
                        type="button"
                        onClick={() => selectJikanManga(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition text-left"
                      >
                        {item.images?.jpg?.image_url && (
                          <img
                            src={item.images.jpg.image_url}
                            alt={item.title}
                            className="w-8 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="text-xs text-gray-400">
                            {item.volumes ? `${item.volumes} volumes` : 'Volumes desconhecidos'} •{' '}
                            {item.genres?.map(g => g.name).join(', ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Selecione um resultado para preencher automaticamente</p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {form.coverUrl && (
                  <div className="flex justify-center">
                    <img src={form.coverUrl} alt="Capa" className="h-32 rounded-lg object-cover" />
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Volume *</label>
                  <input
                    type="number"
                    value={form.volume}
                    onChange={e => setForm({ ...form, volume: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                  >
                    <option value="WANT_TO_READ">Quero Ler</option>
                    <option value="READING">Lendo</option>
                    <option value="READ">Lido</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Gênero</label>
                  <input
                    type="text"
                    value={form.genre}
                    onChange={e => setForm({ ...form, genre: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                    placeholder="Ex: Shonen, Seinen..."
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nota (0-10)</label>
                  <input
                    type="number"
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setJikanResults([]); setJikanQuery('') }}
                    className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-3 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}