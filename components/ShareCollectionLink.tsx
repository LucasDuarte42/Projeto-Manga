'use client'

import { useState } from 'react'
import { Link2, Copy, Check, Share2, Trash2 } from 'lucide-react'

export default function ShareCollectionLink() {
  const [link, setLink] = useState<string | null>(null)
  const [shareId, setShareId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function createLink() {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/collection/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível criar o link')
      setShareId(data.id)
      setLink(`${window.location.origin}/share/${data.token}`)
      setMessage('Link criado. Copie e envie para seu amigo.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao criar link')
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setMessage('Link copiado para a área de transferência.')
    } catch {
      setMessage('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.')
    }
  }

  async function shareLink() {
    if (!link) return
    if (navigator.share) {
      await navigator.share({ title: 'Minha coleção no Pinakes Manga', text: 'Veja minha coleção de mangás e HQs.', url: link }).catch(() => undefined)
    } else {
      await copyLink()
    }
  }

  async function revokeLink() {
    if (!shareId || !window.confirm('Revogar este link? Quem tiver o endereço não poderá mais acessar a coleção.')) return
    setBusy(true)
    try {
      const response = await fetch('/api/collection/share', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shareId }),
      })
      if (!response.ok) throw new Error('Não foi possível revogar o link')
      setLink(null)
      setShareId(null)
      setMessage('Link revogado com sucesso.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao revogar link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-purple-500/20 bg-purple-950/20 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Compartilhe sua coleção</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Mostre suas obras para um amigo</h2>
          <p className="mt-1 text-sm text-gray-400">O link não exibe seu e-mail, senha ou dados de outras contas.</p>
        </div>
        {!link && <button type="button" onClick={createLink} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"><Link2 size={17} />{busy ? 'Criando...' : 'Criar link'}</button>}
      </div>
      {link && <div className="mt-4 space-y-3"><div className="flex flex-col gap-2 sm:flex-row"><input readOnly value={link} aria-label="Link da coleção compartilhada" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-gray-950/70 px-3 py-2.5 text-sm text-gray-300 outline-none" /><button type="button" onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/5"><Copy size={16} />Copiar</button><button type="button" onClick={shareLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/30 px-3 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-500/10"><Share2 size={16} />Compartilhar</button></div><button type="button" onClick={revokeLink} disabled={busy} className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-200 disabled:opacity-50"><Trash2 size={15} />Revogar link</button></div>}
      {message && <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm text-purple-200"><Check size={15} />{message}</p>}
    </section>
  )
}
