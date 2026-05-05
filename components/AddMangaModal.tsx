'use client'

import { useState } from 'react'

interface MangaResult {
  mal_id:  number
  title:   string
  image:   string | null
  volumes: number | null
  status:  string
  score:   number | null
  genre:   string | null
  author:  string | null
}

interface Props {
  onClose: () => void
  onAdd:   (manga: MangaResult) => Promise<void>
}

export default function AddMangaModal({ onClose, onAdd }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<MangaResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding,  setAdding]  = useState<number | null>(null)
  const [added,   setAdded]   = useState<number[]>([])
  const [error,   setError]   = useState<string | null>(null)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/manga/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.mangas)
    } catch {
      setError('Erro ao buscar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(manga: MangaResult) {
    setAdding(manga.mal_id)
    try {
      await onAdd(manga)
      setAdded(prev => [...prev, manga.mal_id])
    } catch {
      setError('Erro ao adicionar manga.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl flex flex-col gap-4 p-6 max-h-[90vh]">

        <div className="flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Adicionar Mangá</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition">✕</button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Naruto, Berserk, One Piece..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 outline-none border border-gray-700 focus:border-purple-500 transition"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {results.length === 0 && !loading && (
            <p className="text-gray-500 text-sm text-center py-8">
              Pesquise um mangá pelo nome acima
            </p>
          )}

          {results.map((manga) => {
            const isAdded  = added.includes(manga.mal_id)
            const isAdding = adding === manga.mal_id

            return (
              <div key={manga.mal_id} className="flex gap-3 bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex-shrink-0">
                  {manga.image ? (
                    <img src={manga.image} alt={manga.title} className="w-12 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-xs">?</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{manga.title}</p>
                  {manga.author && (
                    <p className="text-gray-400 text-xs">{manga.author}</p>
                  )}
                  {manga.genre && (
                    <p className="text-purple-400 text-xs">{manga.genre}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {manga.volumes ? `${manga.volumes} volumes` : 'Volumes desconhecidos'}
                    {manga.score ? ` · ⭐ ${manga.score}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => !isAdded && handleAdd(manga)}
                  disabled={isAdding || isAdded}
                  className={`self-center text-white text-xs px-3 py-2 rounded-lg font-medium transition flex-shrink-0 ${
                    isAdded
                      ? 'bg-gray-600 cursor-default'
                      : 'bg-green-700 hover:bg-green-600 disabled:opacity-50'
                  }`}
                >
                  {isAdding ? '...' : isAdded ? '✓ Adicionado' : '+ Add'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}