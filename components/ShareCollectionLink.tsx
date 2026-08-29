'use client'

import { useState } from 'react'
import { Check, Copy, Link2, Share2, Trash2, X } from 'lucide-react'

export default function ShareCollectionLink() {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [shareId, setShareId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function readResponse(response: Response) {
    const text = await response.text()
    if (!text.trim()) {
      throw new Error(`O servidor retornou uma resposta vazia (HTTP ${response.status}).`)
    }
    try {
      return JSON.parse(text) as { id?: string; token?: string; error?: string }
    } catch {
      throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}).`)
    }
  }

  async function createLink() {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/collection/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 }),
      })
      const data = await readResponse(response)
      if (!response.ok) throw new Error(data.error || `Não foi possível criar o link (HTTP ${response.status})`)
      if (!data.id || !data.token) throw new Error('A API não retornou os dados necessários para criar o link.')
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
      await navigator.share({
        title: 'Minha coleção no Pinakes Manga',
        text: 'Veja minha coleção de mangás e HQs.',
        url: link,
      }).catch(() => undefined)
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
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: shareId }),
      })
      if (!response.ok) {
        const data = await readResponse(response)
        throw new Error(data.error || `Não foi possível revogar o link (HTTP ${response.status})`)
      }
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
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setMessage(null)
        }}
        className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2.5 text-sm font-semibold text-purple-200 transition hover:border-purple-400/50 hover:bg-purple-500/20 sm:px-4"
        title="Compartilhar minha coleção"
      >
        <Share2 size={17} />
        <span className="hidden sm:inline">Compartilhar</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-collection-title"
            className="w-full max-w-lg rounded-2xl border border-purple-500/20 bg-gray-950 p-5 shadow-2xl shadow-black/40 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Compartilhe sua coleção</p>
                <h2 id="share-collection-title" className="mt-1 text-lg font-semibold text-white">Mostre suas obras para um amigo</h2>
                <p className="mt-1 text-sm text-gray-400">O link não exibe seu e-mail, senha ou dados de outras contas.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white" aria-label="Fechar diálogo">
                <X size={19} />
              </button>
            </div>

            {!link ? (
              <button type="button" onClick={createLink} disabled={busy} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Link2 size={17} />
                {busy ? 'Criando...' : 'Criar link'}
              </button>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={link} aria-label="Link da coleção compartilhada" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-gray-300 outline-none" />
                  <button type="button" onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/5"><Copy size={16} />Copiar</button>
                  <button type="button" onClick={shareLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/30 px-3 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-500/10"><Share2 size={16} />Compartilhar</button>
                </div>
                <button type="button" onClick={revokeLink} disabled={busy} className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-200 disabled:opacity-50"><Trash2 size={15} />Revogar link</button>
              </div>
            )}

            {message && <p role="status" className="mt-4 flex items-start gap-2 text-sm text-purple-200"><Check size={15} className="mt-0.5 shrink-0" />{message}</p>}
          </section>
        </div>
      )}
    </>
  )
}
