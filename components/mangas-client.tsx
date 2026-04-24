'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MangaSearch from './manga-search'
import { type JikanManga } from '@/lib/jikan'

type Manga = {
  id: string
  name: string
  volume: number
  totalVolumes: number | null
  status: 'READ' | 'READING' | 'WANT_TO_READ'
  genre: string | null
  note: number | null
  coverUrl: string | null
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

export default function MangasClient({ initialMangas }: { initialMangas: Manga[] }) {
  const router = useRouter()
  const [mangas, setMangas] = useState<Manga[]>(initialMangas)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    volume: '',
    totalVolumes: '',
    status: 'WANT_TO_READ',
    genre: '',
    note: '',
    coverUrl: '',
  })

  const filteredMangas = mangas.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSelectManga = (jikanManga: JikanManga) => {
    setForm(prev => ({
      ...prev,
      name: jikanManga.title,
      totalVolumes: jikanManga.volumes ? String(jikanManga.volumes) : '',
      coverUrl: jikanManga.image_url || '',
      genre: jikanManga.genres?.map(g => g.name).join(', ') || '',
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = editingId ? `/api/mangas/${editingId}` : '/api/mangas'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao salvar mangá')
        setLoading(false)
        return
      }

      if (editingId) {
        setMangas(mangas.map(m => m.id === editingId ? data : m))
        setEditingId(null)
      } else {
        setMangas([data, ...mangas])
      }

      setForm({
        name: '',
        volume: '',
        totalVolumes: '',
        status: 'WANT_TO_READ',
        genre: '',
        note: '',
        coverUrl: '',
      })
      setShowForm(false)
      setLoading(false)
    } catch (err) {
      setError('Erro ao salvar mangá')
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este mangá?')) return

    try {
      const res = await fetch(`/api/mangas/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        setError('Erro ao deletar mangá')
        return
      }

      setMangas(mangas.filter(m => m.id !== id))
    } catch (err) {
      setError('Erro ao deletar mangá')
    }
  }

  function handleEdit(manga: Manga) {
    setForm({
      name: manga.name,
      volume: String(manga.volume),
      totalVolumes: manga.totalVolumes ? String(manga.totalVolumes) : '',
      status: manga.status,
      genre: manga.genre || '',
      note: manga.note ? String(manga.note) : '',
      coverUrl: manga.coverUrl || '',
    })
    setEditingId(manga.id)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setForm({
      name: '',
      volume: '',
      totalVolumes: '',
      status: 'WANT_TO_READ',
      genre: '',
      note: '',
      coverUrl: '',
    })
    setError('')
  }

  // Calcular estatísticas
  const volumesDoUsuario = mangas.reduce((acc, m) => acc + m.volume, 0)
  const volumesFaltando = mangas.reduce((acc, m) => {
    if (m.totalVolumes && m.volume < m.totalVolumes) {
      return acc + (m.totalVolumes - m.volume)
    }
    return acc
  }, 0)

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      {mangas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total de Mangás</p>
            <p className="text-2xl font-bold text-purple-400">{mangas.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Volumes que Tenho</p>
            <p className="text-2xl font-bold text-blue-400">{volumesDoUsuario}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Volumes Faltando</p>
            <p className="text-2xl font-bold text-red-400">{volumesFaltando}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Coleções Completas</p>
            <p className="text-2xl font-bold text-green-400">
              {mangas.filter(m => m.totalVolumes && m.volume >= m.totalVolumes).length}
            </p>
          </div>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex gap-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
        >
          <option value="">Todos os status</option>
          <option value="READ">Lidos</option>
          <option value="READING">Lendo</option>
          <option value="WANT_TO_READ">Quero Ler</option>
        </select>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancelar' : '+ Adicionar Mangá'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold mb-4">
            {editingId ? 'Editar Mangá' : 'Adicionar Novo Mangá'}
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca Jikan */}
            <div className="md:col-span-2">
              <MangaSearch
                onSelectManga={handleSelectManga}
                disabled={editingId !== null}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="Nome do mangá"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Volume *</label>
              <input
                type="number"
                required
                min="1"
                value={form.volume}
                onChange={e => setForm({ ...form, volume: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Total de Volumes</label>
              <input
                type="number"
                min="1"
                value={form.totalVolumes}
                onChange={e => setForm({ ...form, totalVolumes: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="Deixe em branco se desconhecido"
              />
              {form.totalVolumes && form.volume && (
                <p className="text-sm text-gray-400 mt-1">
                  Faltam {Math.max(0, parseInt(form.totalVolumes) - parseInt(form.volume))} volumes
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as any })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
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
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="ex: Ação, Romance"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nota (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="8.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 mb-1 block">URL da Capa</label>
              <input
                type="url"
                value={form.coverUrl}
                onChange={e => setForm({ ...form, coverUrl: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="https://..."
              />
            </div>

            {error && <p className="text-red-400 text-sm md:col-span-2">{error}</p>}

            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listagem */}
      {filteredMangas.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400 text-lg mb-4">
            {mangas.length === 0 ? 'Sua coleção está vazia' : 'Nenhum mangá encontrado'}
          </p>
          {mangas.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition text-white"
            >
              Adicionar primeiro mangá
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMangas.map(manga => (
            <div
              key={manga.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500 transition"
            >
              {manga.coverUrl && (
                <div className="relative h-48 bg-gray-800">
                  <img
                    src={manga.coverUrl}
                    alt={manga.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{manga.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor[manga.status]}`}>
                      {statusLabel[manga.status]}
                    </span>
                    {manga.note && (
                      <span className="text-yellow-400 font-semibold">⭐ {manga.note}</span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-400 space-y-1">
                  <p>
                    <span className="font-semibold">Volume:</span> {manga.volume}
                    {manga.totalVolumes && ` / ${manga.totalVolumes}`}
                  </p>
                  {manga.totalVolumes && manga.volume < manga.totalVolumes && (
                    <p className="text-red-400">
                      <span className="font-semibold">Faltam:</span> {manga.totalVolumes - manga.volume} volumes
                    </p>
                  )}
                  {manga.genre && <p><span className="font-semibold">Gênero:</span> {manga.genre}</p>}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => handleEdit(manga)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(manga.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded transition"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
