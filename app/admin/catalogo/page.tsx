'use client'

import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

type CatalogEntry = {
  id: string
  name: string
  author: string | null
  coverUrl: string | null
  collectionType: 'MANGA' | 'HQ'
  _count: { mangas: number }
}

type Draft = { name: string; author: string; coverUrl: string }

export default function AdminCatalogPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [entries, setEntries] = useState<CatalogEntry[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadEntries(q: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/catalog?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o catálogo.')
      setEntries(data)
      setDrafts((current) => Object.fromEntries(data.map((entry: CatalogEntry) => [entry.id, current[entry.id] || { name: entry.name, author: entry.author || '', coverUrl: entry.coverUrl || '' }])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o catálogo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadEntries(debouncedQuery) }, [debouncedQuery])

  async function saveEntry(entry: CatalogEntry) {
    const draft = drafts[entry.id]
    if (!draft) return
    setSaving(entry.id)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/catalog/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name, author: draft.author || null, coverUrl: draft.coverUrl || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar as alterações.')
      setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, name: data.name, author: data.author, coverUrl: data.coverUrl } : item)))
      setMessage(`"${data.name}" atualizado em ${entry._count.mangas} coleção(ões).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Administração</p>
            <h1 className="mt-2 text-3xl font-bold">Obras do catálogo</h1>
            <p className="mt-2 text-sm text-gray-400">Corrija título, autor ou capa de uma obra já adicionada — a mudança vale para todos que já têm ela na coleção.</p>
          </div>
          <a href="/admin/solicitacoes" className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-purple-500 hover:text-white">Ver solicitações</a>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar obra pelo título..."
          className="mb-6 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
        />

        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-10 text-center text-gray-400">Carregando catálogo...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-gray-500">Nenhuma obra encontrada.</div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const draft = drafts[entry.id] || { name: entry.name, author: entry.author || '', coverUrl: entry.coverUrl || '' }
              return (
                <article key={entry.id} className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 sm:p-5">
                  <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{entry.name}</h2>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gray-300">{entry.collectionType === 'MANGA' ? 'Mangá' : 'HQ'}</span>
                        <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-[11px] font-semibold text-purple-300">{entry._count.mangas} na(s) coleção(ões)</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                          <span className="mb-1 block text-xs text-gray-500">Título</span>
                          <input value={draft.name} onChange={(event) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, name: event.target.value } }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                        </label>
                        <label>
                          <span className="mb-1 block text-xs text-gray-500">Autor</span>
                          <input value={draft.author} onChange={(event) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, author: event.target.value } }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">URL HTTPS da capa</span>
                        <input type="url" value={draft.coverUrl} onChange={(event) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, coverUrl: event.target.value } }))} placeholder="https://..." className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
                      </label>
                      <button type="button" onClick={() => void saveEntry(entry)} disabled={saving === entry.id || !draft.name.trim()} className="w-full rounded-lg bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50">{saving === entry.id ? 'Salvando...' : 'Salvar alterações'}</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
