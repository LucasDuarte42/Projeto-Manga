'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Check, Clock3, History, Library, UserRound } from 'lucide-react'

type VolumeStatus = 'MISSING' | 'OWNED' | 'READ' | 'LOANED'

interface VolumeRecord {
  id: string
  number: number
  status: VolumeStatus
  loanedTo: string | null
  dueDate: string | null
  history: Array<{
    fromStatus: VolumeStatus | null
    toStatus: VolumeStatus
    loanedTo: string | null
    dueDate: string | null
    changedAt: string
  }>
}

const STATUS_LABELS: Record<VolumeStatus, string> = {
  MISSING: 'Faltando',
  OWNED: 'Adquirido',
  READ: 'Lido',
  LOANED: 'Emprestado',
}

const STATUS_STYLES: Record<VolumeStatus, string> = {
  MISSING: 'border-white/10 bg-white/[0.03] text-gray-400',
  OWNED: 'border-purple-500/30 bg-purple-500/10 text-purple-200',
  READ: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  LOANED: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
}

function statusIcon(status: VolumeStatus) {
  if (status === 'READ') return <Check size={14} />
  if (status === 'LOANED') return <UserRound size={14} />
  if (status === 'OWNED') return <Library size={14} />
  return <Clock3 size={14} />
}

interface VolumeTrackerProps {
  mangaId: string
  totalVolumes: number
  onChanged: () => void
}

export default function VolumeTracker({ mangaId, totalVolumes, onChanged }: VolumeTrackerProps) {
  const [volumes, setVolumes] = useState<VolumeRecord[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, { status: VolumeStatus; loanedTo: string; dueDate: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadVolumes() {
    try {
      setLoading(true)
      const response = await fetch(`/api/mangas/${mangaId}/volumes/status`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Não foi possível carregar os volumes')
      const data = await response.json()
      setVolumes(data.volumes ?? [])
      setDrafts(Object.fromEntries((data.volumes ?? []).map((volume: VolumeRecord) => [volume.number, {
        status: volume.status,
        loanedTo: volume.loanedTo ?? '',
        dueDate: volume.dueDate ? volume.dueDate.slice(0, 10) : '',
      }])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar volumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (totalVolumes > 0) loadVolumes()
  }, [mangaId, totalVolumes])

  async function saveVolume(number: number) {
    const draft = drafts[number]
    if (!draft) return
    setSaving(number)
    setError(null)
    try {
      const response = await fetch(`/api/mangas/${mangaId}/volumes/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volume: number,
          status: draft.status,
          loanedTo: draft.status === 'LOANED' ? draft.loanedTo || null : null,
          dueDate: draft.status === 'LOANED' && draft.dueDate ? `${draft.dueDate}T23:59:59.000Z` : null,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível salvar o volume')
      await loadVolumes()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar volume')
    } finally {
      setSaving(null)
    }
  }

  if (totalVolumes <= 0) return null

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Controle detalhado</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Status de cada volume</h2>
          <p className="mt-2 text-sm text-gray-500">Marque aquisição, leitura e empréstimos. Cada alteração fica registrada.</p>
        </div>
        <BookOpen className="text-purple-400" size={22} />
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Carregando volumes...</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {volumes.map((volume) => {
            const draft = drafts[volume.number]
            if (!draft) return null
            const isExpanded = expanded === volume.number
            return (
              <div key={volume.number} className={`rounded-2xl border p-4 ${STATUS_STYLES[draft.status]}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold">Volume {volume.number}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium">{statusIcon(draft.status)}{STATUS_LABELS[draft.status]}</span>
                </div>
                <select
                  value={draft.status}
                  onChange={(event) => setDrafts((current) => ({ ...current, [volume.number]: { ...draft, status: event.target.value as VolumeStatus } }))}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-gray-950/60 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500"
                  aria-label={`Status do volume ${volume.number}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                {draft.status === 'LOANED' && (
                  <div className="mt-3 grid gap-2">
                    <input value={draft.loanedTo} onChange={(event) => setDrafts((current) => ({ ...current, [volume.number]: { ...draft, loanedTo: event.target.value } }))} placeholder="Emprestado para" className="rounded-lg border border-white/10 bg-gray-950/60 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500" />
                    <input type="date" value={draft.dueDate} onChange={(event) => setDrafts((current) => ({ ...current, [volume.number]: { ...draft, dueDate: event.target.value } }))} className="rounded-lg border border-white/10 bg-gray-950/60 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500" aria-label={`Data de devolução do volume ${volume.number}`} />
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setExpanded(isExpanded ? null : volume.number)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><History size={14} />Histórico</button>
                  <button type="button" onClick={() => saveVolume(volume.number)} disabled={saving === volume.number} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50">{saving === volume.number ? 'Salvando...' : 'Salvar'}</button>
                </div>
                {isExpanded && <div className="mt-3 border-t border-white/10 pt-3 text-xs text-gray-400">{volume.history.length === 0 ? 'Sem alterações registradas.' : volume.history.slice(0, 5).map((entry, index) => <p key={`${entry.changedAt}-${index}`} className="mb-2">{new Date(entry.changedAt).toLocaleDateString('pt-BR')} · {STATUS_LABELS[entry.toStatus]}{entry.loanedTo ? ` para ${entry.loanedTo}` : ''}</p>)}</div>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
