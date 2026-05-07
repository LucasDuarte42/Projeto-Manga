'use client'

import { useState } from 'react'

type CollectionType = 'MANGA' | 'HQ'

interface ItemResult {
  mal_id:  number
  title:   string
  image:   string | null
  volumes: number | null
  status:  string
  score:   number | null
  genre:   string | null
  author:  string | null
}

interface ManualForm {
  title:   string
  author:  string
  volumes: string
  genre:   string
  image:   string
  type:    CollectionType
}

interface Props {
  onClose: () => void
  onAdd:   (item: ItemResult, type: CollectionType) => Promise<void>
  onAddManual: (form: ManualForm) => Promise<void>
}

const COLLECTION_TYPES: { value: CollectionType; label: string; emoji: string }[] = [
  { value: 'MANGA', label: 'Mangá', emoji: '📚' },
  { value: 'HQ', label: 'HQ', emoji: '💥' },
]

export default function AddItemModal({ onClose, onAdd, onAddManual }: Props) {
  const [tab,     setTab]     = useState<'search' | 'manual'>('search')
  const [type,    setType]    = useState<CollectionType>('MANGA')
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<ItemResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding,  setAdding]  = useState<number | null>(null)
  const [added,   setAdded]   = useState<number[]>([])
  const [error,   setError]   = useState<string | null>(null)

  const [manual, setManual] = useState<ManualForm>({
    title: '', author: '', volumes: '', genre: '', image: '', type: 'MANGA'
  })
  const [savingManual, setSavingManual] = useState(false)
  const [manualSuccess, setManualSuccess] = useState(false)

  const currentTypeInfo = COLLECTION_TYPES.find(t => t.value === type)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    
    // Define qual API usar com base no tipo
    const isManga = type === 'MANGA'
    const endpoint = isManga ? '/api/manga/search' : '/api/comic/search'
    
    try {
      const res  = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      // Padroniza os resultados (mangas ou comics)
      setResults(isManga ? data.mangas : data.comics)
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(item: ItemResult) {
    setAdding(item.mal_id)
    try {
      await onAdd(item, type)
      setAdded(prev => [...prev, item.mal_id])
    } catch {
      setError(`Erro ao adicionar ${currentTypeInfo?.label.toLowerCase()}.`)
    } finally {
      setAdding(null)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manual.title) return
    setSavingManual(true)
    try {
      await onAddManual(manual)
      setManualSuccess(true)
      setManual({ title: '', author: '', volumes: '', genre: '', image: '', type: 'MANGA' })
      setTimeout(() => setManualSuccess(false), 3000)
    } catch {
      setError('Erro ao adicionar.')
    } finally {
      setSavingManual(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl flex flex-col gap-4 p-4 sm:p-6 max-h-[95vh] overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Adicionar à Coleção</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition">✕</button>
        </div>

        {/* Type Selector */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {COLLECTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => {
                setType(t.value)
                setManual({ ...manual, type: t.value })
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                type === t.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          <button
            onClick={() => setTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'search'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔍 Buscar na API
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'manual'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ✏️ Adicionar Manualmente
          </button>
        </div>

        {/* Aba busca */}
        {tab === 'search' && (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Ex: ${type === 'MANGA' ? 'Naruto, Berserk, One Piece...' : 'Batman, Spider-Man, X-Men...'}`}
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
                  Pesquise um {currentTypeInfo?.label.toLowerCase()} pelo nome acima
                </p>
              )}

              {results.map((item) => {
                const isAdded  = added.includes(item.mal_id)
                const isAdding = adding === item.mal_id

                return (
                  <div key={item.mal_id} className="flex gap-3 bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-xs">?</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.title}</p>
                      {item.author && <p className="text-gray-400 text-xs">{item.author}</p>}
                      {item.genre && <p className="text-purple-400 text-xs">{item.genre}</p>}
                      <p className="text-gray-500 text-xs mt-1">
                        {item.volumes ? `${item.volumes} volumes` : 'Volumes desconhecidos'}
                        {item.score ? ` · ⭐ ${item.score}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => !isAdded && handleAdd(item)}
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
          </>
        )}

        {/* Aba manual */}
        {tab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 overflow-y-auto">
            {manualSuccess && (
              <div className="bg-green-900 border border-green-700 text-green-200 text-sm px-4 py-3 rounded-lg">
                ✓ Adicionado com sucesso!
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Título *</label>
              <input
                type="text"
                value={manual.title}
                onChange={e => setManual({ ...manual, title: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder={`Ex: ${type === 'MANGA' ? 'Naruto Vol. 1' : 'Batman: Ano Um'}`}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Autor</label>
              <input
                type="text"
                value={manual.author}
                onChange={e => setManual({ ...manual, author: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder={`Ex: ${type === 'MANGA' ? 'Masashi Kishimoto' : 'Frank Miller'}`}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Gênero</label>
              <input
                type="text"
                value={manual.genre}
                onChange={e => setManual({ ...manual, genre: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="Ex: Ação, Super-herói, Drama..."
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Total de Volumes</label>
              <input
                type="number"
                value={manual.volumes}
                onChange={e => setManual({ ...manual, volumes: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="Ex: 12"
                min={1}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">URL da Capa</label>
              <input
                type="url"
                value={manual.image}
                onChange={e => setManual({ ...manual, image: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
                placeholder="https://..."
              />
              {manual.image && (
                <img
                  src={manual.image}
                  alt="Preview"
                  className="mt-2 h-24 rounded-lg object-cover"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={savingManual || !manual.title}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {savingManual ? 'Adicionando...' : 'Adicionar à Coleção'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
