'use client'

import { useEffect, useMemo, useState } from 'react'

type RequestStatus = 'PENDING' | 'REJECTED'

type RequestDraft = { title: string; author: string; totalVolumes: string; collectionType: 'MANGA' | 'HQ' }

type MangaRequest = {
  id: string
  title: string
  author: string | null
  totalVolumes: number | null
  collectionType: 'MANGA' | 'HQ'
  coverUrl: string | null
  status: RequestStatus
  createdAt: string
  user: { id: string; name: string | null; email: string }
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<MangaRequest[]>([])
  const [filter, setFilter] = useState<'ALL' | RequestStatus>('ALL')
  const [covers, setCovers] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, RequestDraft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadRequests() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/manga-requests', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as solicitações.')
      setRequests(data)
      setCovers((current) => Object.fromEntries(data.map((request: MangaRequest) => [request.id, current[request.id] || request.coverUrl || ''])))
      setDrafts((current) => Object.fromEntries(data.map((request: MangaRequest) => [request.id, current[request.id] || { title: request.title, author: request.author || '', totalVolumes: request.totalVolumes?.toString() || '', collectionType: request.collectionType }])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar solicitações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadRequests() }, [])

  async function deleteRequest(request: MangaRequest) {
    setSaving(request.id)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/manga-requests/${request.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir a solicitação.')
      setRequests((current) => current.filter((item) => item.id !== request.id))
      setMessage('Solicitação excluída.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir solicitação.')
    } finally {
      setSaving(null)
    }
  }

  async function updateRequest(request: MangaRequest, action: 'APPROVE' | 'REJECT') {
    setSaving(request.id)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/manga-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...drafts[request.id], totalVolumes: drafts[request.id]?.totalVolumes ? Number(drafts[request.id].totalVolumes) : null, action, coverUrl: covers[request.id] || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar a solicitação.')
      setRequests((current) => current.filter((item) => item.id !== request.id))
      setMessage(action === 'APPROVE' ? 'Obra aprovada e adicionada à coleção do solicitante.' : 'Solicitação rejeitada.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar solicitação.')
    } finally {
      setSaving(null)
    }
  }

  const visibleRequests = useMemo(() => filter === 'ALL' ? requests : requests.filter((request) => request.status === filter), [filter, requests])
  const pendingCount = requests.filter((request) => request.status === 'PENDING').length
  const rejectedCount = requests.filter((request) => request.status === 'REJECTED').length

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Administração</p>
            <h1 className="mt-2 text-3xl font-bold">Solicitações de obras</h1>
            <p className="mt-2 text-sm text-gray-400">Revise, complete a capa e gerencie as solicitações recebidas.</p>
          </div>
          <div className="flex gap-2">
            <a href="/admin/catalogo" className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-purple-500 hover:text-white">Editar obras do catálogo</a>
            <button type="button" onClick={() => void loadRequests()} className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-purple-500 hover:text-white">Atualizar lista</button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {([['ALL', 'Todas', requests.length], ['PENDING', 'Pendentes', pendingCount], ['REJECTED', 'Rejeitadas', rejectedCount]] as const).map(([key, label, count]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-2xl border p-4 text-left transition ${filter === key ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 bg-gray-900/50 hover:border-white/20'}`}>
              <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{count}</p>
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>}

        {loading ? <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-10 text-center text-gray-400">Carregando solicitações...</div> : visibleRequests.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-gray-500">Nenhuma solicitação nesta categoria.</div> : <div className="space-y-4">{visibleRequests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{request.title}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${request.status === 'PENDING' ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>{request.status === 'PENDING' ? 'Pendente' : 'Rejeitada'}</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-xs text-gray-500">Título</span><input value={drafts[request.id]?.title || ''} onChange={(event) => setDrafts((current) => ({ ...current, [request.id]: { ...current[request.id], title: event.target.value } }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" /></label><label><span className="mb-1 block text-xs text-gray-500">Autor</span><input value={drafts[request.id]?.author || ''} onChange={(event) => setDrafts((current) => ({ ...current, [request.id]: { ...current[request.id], author: event.target.value } }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" /></label><label><span className="mb-1 block text-xs text-gray-500">Total de volumes</span><input type="number" min="1" value={drafts[request.id]?.totalVolumes || ''} onChange={(event) => setDrafts((current) => ({ ...current, [request.id]: { ...current[request.id], totalVolumes: event.target.value } }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" /></label><label><span className="mb-1 block text-xs text-gray-500">Tipo</span><select value={drafts[request.id]?.collectionType || request.collectionType} onChange={(event) => setDrafts((current) => ({ ...current, [request.id]: { ...current[request.id], collectionType: event.target.value as 'MANGA' | 'HQ' } }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"><option value="MANGA">Mangá</option><option value="HQ">HQ</option></select></label><div><p className="text-xs text-gray-500">Solicitante</p><p className="mt-1 truncate text-sm text-gray-200">{request.user.name || request.user.email}</p><p className="text-xs text-gray-500">{request.user.email}</p></div></div>
                <p className="mt-4 text-xs text-gray-500">Enviada em {new Date(request.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className="space-y-3"><label className="block"><span className="mb-1 block text-xs font-medium text-gray-400">URL HTTPS da capa</span><input aria-label="URL HTTPS da capa" type="url" value={covers[request.id] || ''} onChange={(event) => setCovers((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" /></label>{request.status === 'REJECTED' ? <button type="button" onClick={() => void deleteRequest(request)} disabled={saving === request.id} className="w-full rounded-lg border border-red-500/30 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">{saving === request.id ? 'Excluindo...' : 'Excluir definitivamente'}</button> : <div className="flex gap-2"><button type="button" onClick={() => void updateRequest(request, 'REJECT')} disabled={saving === request.id} className="flex-1 rounded-lg border border-red-500/30 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">Rejeitar</button><button type="button" onClick={() => void updateRequest(request, 'APPROVE')} disabled={saving === request.id || !covers[request.id]?.trim()} className="flex-1 rounded-lg bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50">{saving === request.id ? 'Salvando...' : 'Aprovar e incluir'}</button></div>}</div>
            </div>
          </article>
        ))}</div>}
      </div>
    </main>
  )
}
