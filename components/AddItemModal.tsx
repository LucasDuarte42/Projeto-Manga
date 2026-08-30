'use client'

import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

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
  const debouncedQuery = useDebouncedValue(query)
  const [results, setResults] = useState<ItemResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding,  setAdding]  = useState<number | null>(null)
  const [added,   setAdded]   = useState<number[]>([])
  const [error,   setError]   = useState<string | null>(null)

  const [manual, setManual] = useState<ManualForm>({
    title: '', author: '', volumes: '', type: 'MANGA'
  })
  const [savingManual, setSavingManual] = useState(false)
  const [manualSuccess, setManualSuccess] = useState(false)
  const [reviewingManual, setReviewingManual] = useState(false)
  const [pendingManual, setPendingManual] = useState<ManualForm | null>(null)

  const currentTypeInfo = COLLECTION_TYPES.find(t => t.value === type)

  async function handleSearch(searchTerm = query) {
    if (searchTerm.trim().length < 3) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    
    // Define qual API usar com base no tipo
    const isManga = type === 'MANGA'
    const endpoint = isManga ? '/api/manga/search' : '/api/comic/search'
    
    try {
      const res  = await fetch(`${endpoint}?q=${encodeURIComponent(searchTerm.trim())}`)
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

  useEffect(() => {
    if (tab === 'search' && debouncedQuery.trim().length >= 3) {
      void handleSearch(debouncedQuery)
    }
  }, [debouncedQuery, tab, type])

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

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manual.title.trim()) return
    setError(null)
    setPendingManual({ ...manual, title: manual.title.trim() })
    setReviewingManual(true)
  }

  async function handleConfirmManual() {
    if (!pendingManual) return
    setSavingManual(true)
    setError(null)
    try {
      await onAddManual(pendingManual)
      setManualSuccess(true)
      setManual({ title: '', author: '', volumes: '', type: 'MANGA' })
      setPendingManual(null)
      setReviewingManual(false)
      setTimeout(() => setManualSuccess(false), 3000)
    } catch {
      setError('Não foi possível enviar a solicitação para a coleção.')
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
            ✉️ Solicitar adição de obra
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
                onClick={() => void handleSearch()}
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
          reviewingManual && pendingManual ? (
            <div className="flex flex-col gap-5 overflow-y-auto">
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Solicitação pronta para confirmação</p>
                <p className="mt-1 text-sm text-gray-400">Confira os dados abaixo antes de incluir esta obra na sua coleção.</p>
              </div>
              <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-4">
                <div className="flex gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-white">{pendingManual.title}</h3>
                    <p className="text-sm text-gray-400">{pendingManual.author || 'Autor não informado'}</p>
                    <p className="text-xs text-purple-300">{pendingManual.type === 'MANGA' ? 'Mangá' : 'HQ'}</p>
                    <p className="text-xs text-gray-500">{pendingManual.volumes ? `${pendingManual.volumes} volumes` : 'Total de volumes não informado'}</p>
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setReviewingManual(false); setError(null) }} className="flex-1 rounded-lg border border-gray-700 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white">Voltar e editar</button>
                <button type="button" onClick={() => void handleConfirmManual()} disabled={savingManual} className="flex-1 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50">{savingManual ? 'Enviando...' : 'Confirmar e adicionar'}</button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 overflow-y-auto">
            {manualSuccess && (
              <div className="bg-green-900 border border-green-700 text-green-200 text-sm px-4 py-3 rounded-lg">
                ✓ Solicitação confirmada e obra adicionada!
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


            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={savingManual || !manual.title}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {savingManual ? 'Enviando solicitação...' : 'Enviar solicitação'}
            </button>
          </form>
          )
        )}
      </div>
    </div>
  )
}
