'use client'

import { useState } from 'react'
import { searchMangaJikan, type JikanManga } from '@/lib/jikan'

interface MangaSearchProps {
  onSelectManga: (manga: JikanManga) => void
  disabled?: boolean
}

export default function MangaSearch({
  onSelectManga,
  disabled = false,
}: MangaSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JikanManga[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(value: string) {
    setQuery(value)
    setError('')

    if (value.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      const mangas = await searchMangaJikan(value)
      setResults(mangas)
    } catch {
      setError('Erro ao buscar mangás')
      setResults([])
    }

    setLoading(false)
  }

  function handleSelect(manga: JikanManga) {
    onSelectManga(manga)
    setQuery(manga.title)
    setResults([])
  }

  return (
    <div className="relative">
      <label className="text-sm text-gray-400 mb-1 block">
        Buscar Mangá (Jikan)
      </label>

      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Digite o nome do mangá..."
        disabled={disabled}
        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700"
      />

      {loading && (
        <p className="text-sm text-gray-400 mt-2">
          Buscando...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400 mt-2">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg max-h-80 overflow-y-auto">
          {results.map((manga) => (
            <button
              key={manga.mal_id}
              type="button"
              onClick={() => handleSelect(manga)}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 border-b border-gray-700"
            >
              <p className="font-semibold text-white">
                {manga.title}
              </p>
              <p className="text-sm text-gray-400">
                {manga.volumes
                  ? `${manga.volumes} volumes`
                  : 'Volumes desconhecidos'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}