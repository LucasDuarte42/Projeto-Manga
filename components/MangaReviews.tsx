'use client'

import { useEffect, useState } from 'react'
import { Heart, Pencil, Star, Trash2 } from 'lucide-react'

type Review = {
  id: string
  rating: number | null
  body: string
  containsSpoilers: boolean
  createdAt: string
  user: { id: string; name: string | null; avatarUrl: string | null }
  likes: number
  likedByMe: boolean
  isMine: boolean
}

export default function MangaReviews({ mangaId }: { mangaId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [body, setBody] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [spoilers, setSpoilers] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const response = await fetch(`/api/mangas/${mangaId}/reviews`)
    if (response.ok) setReviews((await response.json()).reviews ?? [])
    setLoading(false)
  }
  useEffect(() => { void load() }, [mangaId])

  function startEdit(review: Review) {
    setEditing(true); setBody(review.body); setRating(review.rating); setSpoilers(review.containsSpoilers); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }
  async function save() {
    setSaving(true); setMessage(null)
    try {
      const response = await fetch(`/api/mangas/${mangaId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, rating, containsSpoilers: spoilers }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar a review.')
      setEditing(false); setBody(''); setRating(null); setSpoilers(false); setMessage('Review publicada.'); await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erro ao salvar review.') } finally { setSaving(false) }
  }
  async function remove(reviewId: string) {
    if (!window.confirm('Excluir sua review?')) return
    const response = await fetch(`/api/mangas/${mangaId}/reviews/${reviewId}`, { method: 'DELETE' })
    if (response.ok) { setEditing(false); setBody(''); setRating(null); await load() }
  }
  async function toggleLike(review: Review) {
    const response = await fetch(`/api/mangas/${mangaId}/reviews/${review.id}`, { method: 'POST' })
    if (response.ok) await load()
  }
  const ownReview = reviews.find((review) => review.isMine)
  const average = reviews.filter((review) => review.rating !== null).reduce((sum, review) => sum + (review.rating ?? 0), 0) / (reviews.filter((review) => review.rating !== null).length || 1)

  return <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-6" aria-labelledby="reviews-title">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Comunidade</p><h2 id="reviews-title" className="mt-1 text-2xl font-bold text-white">Reviews da obra</h2></div>{reviews.length > 0 && <p className="text-sm text-gray-400">{average.toFixed(1)} / 5 · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>}</div>
    <div className="mt-6 rounded-2xl border border-white/10 bg-gray-950/50 p-4"><h3 className="font-semibold text-white">{editing ? 'Editar minha review' : ownReview ? 'Atualizar minha review' : 'Escreva sua review'}</h3><div className="mt-3 flex items-center gap-1" aria-label="Escolha uma nota de 0,5 a 5 estrelas">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} estrelas`} className="p-1"><Star size={23} fill={(rating ?? 0) >= value ? 'currentColor' : 'none'} className={(rating ?? 0) >= value ? 'text-amber-300' : 'text-gray-600'} /></button>)}</div><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} rows={4} placeholder="O que você achou desta obra?" className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-gray-900 px-3 py-3 text-sm text-white outline-none focus:border-purple-500" /><label className="mt-3 flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={spoilers} onChange={(event) => setSpoilers(event.target.checked)} />Contém spoilers</label><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void save()} disabled={saving || !body.trim()} className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Salvando...' : editing ? 'Atualizar review' : 'Publicar review'}</button>{editing && <button type="button" onClick={() => { setEditing(false); setBody(''); setRating(null); setSpoilers(false) }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300">Cancelar</button>}</div>{message && <p role="status" className="mt-2 text-xs text-purple-300">{message}</p>}</div>
    <div className="mt-5 space-y-3">{loading ? <p className="text-sm text-gray-500">Carregando reviews...</p> : reviews.length === 0 ? <p className="text-sm text-gray-500">Ainda não há reviews. Seja o primeiro a escrever.</p> : reviews.map((review) => <article key={review.id} className="rounded-2xl border border-white/10 bg-gray-900/40 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{review.user.name || 'Colecionador'}</p><p className="mt-1 text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p></div>{review.rating !== null && <span className="flex shrink-0 items-center gap-1 text-sm text-amber-300"><Star size={14} fill="currentColor" />{review.rating.toFixed(1)}</span>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-300">{review.body}</p>{review.containsSpoilers && <p className="mt-2 text-xs font-medium text-amber-300">Contém spoilers</p>}<div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={() => void toggleLike(review)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs transition ${review.likedByMe ? 'text-pink-300' : 'text-gray-500 hover:text-pink-300'}`}><Heart size={15} fill={review.likedByMe ? 'currentColor' : 'none'} />{review.likes}</button>{review.isMine && <><button type="button" onClick={() => startEdit(review)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-gray-500 hover:text-white"><Pencil size={14} />Editar</button><button type="button" onClick={() => void remove(review.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-red-300 hover:text-red-200"><Trash2 size={14} />Excluir</button></>}</div></article>)}</div>
  </section>
}
