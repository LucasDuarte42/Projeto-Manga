'use client'

import { useState } from 'react'
import { Check, Save, Star } from 'lucide-react'

type HighlightOption = { id: string; name: string; coverUrl: string | null }

export default function ProfileHighlightsSelector({ options, initialSelected }: { options: HighlightOption[]; initialSelected: string[] }) {
  const [selected, setSelected] = useState(initialSelected.slice(0, 3))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function toggle(id: string) {
    setMessage(null)
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)
  }

  async function save() {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/profile/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ mangaIds: selected }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar os destaques.')
      setMessage('Destaques atualizados.')
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar os destaques.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="mb-5 rounded-2xl border border-white/10 bg-gray-900/40 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-gray-200"><span className="flex items-center gap-2"><Star size={16} className="text-purple-400" />Escolher obras em destaque</span><span className="text-xs font-normal text-gray-500">{selected.length}/3 selecionadas</span></summary>
      <p className="mt-3 text-xs text-gray-500">Escolha até três obras para aparecerem no topo do seu perfil.</p>
      {options.length === 0 ? <p className="mt-4 text-sm text-gray-500">Adicione obras à coleção para poder selecioná-las.</p> : <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">{options.map((option) => { const active = selected.includes(option.id); return <button type="button" key={option.id} onClick={() => toggle(option.id)} className={`flex items-center gap-3 rounded-xl border p-2 text-left transition ${active ? 'border-purple-500/60 bg-purple-500/10' : 'border-white/10 bg-gray-950/30 hover:border-white/20'} ${!active && selected.length >= 3 ? 'cursor-not-allowed opacity-50' : ''}`} disabled={!active && selected.length >= 3}><span className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-gray-800">{option.coverUrl ? <img src={option.coverUrl} alt="" className="h-full w-full object-cover" /> : null}</span><span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-200">{option.name}</span>{active && <Check size={16} className="shrink-0 text-purple-400" />}</button> })}</div>}
      <div className="mt-4 flex items-center justify-between gap-3"><button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"><Save size={14} />{busy ? 'Salvando...' : 'Salvar destaques'}</button>{message && <span role="status" className="text-xs text-purple-300">{message}</span>}</div>
    </details>
  )
}
