'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Manga {
  id:           string
  name:         string
  author:       string | null
  volume:       number
  totalVolumes: number | null
  ownedVolumes: number[]
  status:       'READ' | 'READING' | 'WANT_TO_READ'
  note:         number | null
  coverUrl:     string | null
  genre:        string | null
  createdAt:    string
}

interface VolumeRating {
  volume: number
  note:   number
}

const STATUS_CONFIG = {
  READ:         { label: 'Lido',      color: 'bg-green-900 text-green-200',   btn: 'bg-green-700 hover:bg-green-600'   },
  READING:      { label: 'Lendo',     color: 'bg-yellow-900 text-yellow-200', btn: 'bg-yellow-700 hover:bg-yellow-600' },
  WANT_TO_READ: { label: 'Quero Ler', color: 'bg-blue-900 text-blue-200',     btn: 'bg-blue-700 hover:bg-blue-600'     },
}

const NOTE_CONFIG = [
  { max: 10, label: 'Ótimo',    color: 'bg-green-500'  },
  { max: 7,  label: 'Bom',      color: 'bg-yellow-500' },
  { max: 4,  label: 'Regular',  color: 'bg-orange-500' },
  { max: 1,  label: 'Ruim',     color: 'bg-red-500'    },
]

function getNoteConfig(note: number) {
  return NOTE_CONFIG.find(n => note >= n.max - 2) ?? NOTE_CONFIG[NOTE_CONFIG.length - 1]
}

export default function MangaDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [manga,         setManga]         = useState<Manga | null>(null)
  const [volumeRatings, setVolumeRatings] = useState<VolumeRating[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [success,       setSuccess]       = useState<string | null>(null)

  const [mangaName,    setMangaName]    = useState('')
  const [author,       setAuthor]       = useState('')
  const [totalVolumes, setTotalVolumes] = useState('')
  const [ownedVolumes, setOwnedVolumes] = useState<number[]>([])
  const [mangaStatus,  setMangaStatus]  = useState<'READ' | 'READING' | 'WANT_TO_READ'>('WANT_TO_READ')
  const [note,         setNote]         = useState('')

  // Nota temporária sendo editada
  const [pendingRatings, setPendingRatings] = useState<Record<number, number>>({})

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) fetchAll()
  }, [status, id])

  async function fetchAll() {
    try {
      setLoading(true)
      const [mangaRes, ratingsRes] = await Promise.all([
        fetch(`/api/mangas/${id}`),
        fetch(`/api/mangas/${id}/volumes`),
      ])
      if (!mangaRes.ok) throw new Error('Mangá não encontrado')
      const mangaData: Manga = await mangaRes.json()
      const ratingsData: VolumeRating[] = await ratingsRes.json()

      setManga(mangaData)
      setVolumeRatings(ratingsData)
      setMangaName(mangaData.name)
      setAuthor(mangaData.author ?? '')
      setTotalVolumes(mangaData.totalVolumes?.toString() ?? '')
      setOwnedVolumes(mangaData.ownedVolumes ?? [])
      setMangaStatus(mangaData.status)
      setNote(mangaData.note?.toString() ?? '')

      const pending: Record<number, number> = {}
      ratingsData.forEach(r => { pending[r.volume] = r.note })
      setPendingRatings(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!manga) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      // Salva informações do mangá
      const res = await fetch(`/api/mangas/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         mangaName,
          author:       author || null,
          volume:       ownedVolumes.length > 0 ? Math.max(...ownedVolumes) : manga.volume,
          totalVolumes: totalVolumes !== '' ? parseInt(totalVolumes) : null,
          ownedVolumes,
          status:       mangaStatus,
          note:         note !== '' ? parseFloat(note) : null,
          genre:        manga.genre,
          coverUrl:     manga.coverUrl,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')

      // Salva notas por volume
      await Promise.all(
        Object.entries(pendingRatings).map(([vol, n]) =>
          fetch(`/api/mangas/${id}/volumes`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volume: parseInt(vol), note: n }),
          })
        )
      )

      setSuccess('Salvo com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Remover este mangá da coleção?')) return
    setDeleting(true)
    try {
      await fetch(`/api/mangas/${id}`, { method: 'DELETE' })
      router.push('/mangas')
    } catch {
      setError('Erro ao deletar')
      setDeleting(false)
    }
  }

  function toggleVolume(vol: number) {
    setOwnedVolumes(prev =>
      prev.includes(vol)
        ? prev.filter(v => v !== vol)
        : [...prev, vol].sort((a, b) => a - b)
    )
  }

  const totalVolsNum  = totalVolumes !== '' ? parseInt(totalVolumes) : 0
  const volumeArray   = Array.from({ length: totalVolsNum }, (_, i) => i + 1)
  const volumesLidos  = ownedVolumes.length
  const volumesFaltam = totalVolsNum > 0 ? totalVolsNum - volumesLidos : null
  const progresso     = totalVolsNum > 0 ? Math.round((volumesLidos / totalVolsNum) * 100) : null

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (!manga) return null

  const badge = STATUS_CONFIG[manga.status] ?? STATUS_CONFIG['WANT_TO_READ']

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/mangas" className="text-gray-400 hover:text-white transition">
          ← Voltar para coleção
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50"
        >
          {deleting ? 'Removendo...' : 'Remover da coleção'}
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Cabeçalho */}
        <div className="flex gap-6">
          <div className="flex-shrink-0 w-32 h-44 bg-gradient-to-br from-purple-900 to-gray-900 rounded-xl overflow-hidden">
            {manga.coverUrl ? (
              <img src={manga.coverUrl} alt={mangaName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500 text-xs text-center">Sem capa</p>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-2">
            <h1 className="text-2xl font-bold">{mangaName}</h1>
            {author && <p className="text-purple-400 text-sm">{author}</p>}
            <span className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
            <p className="text-gray-500 text-xs">
              Adicionado em {new Date(manga.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Feedback */}
        {success && <div className="p-3 bg-green-900 border border-green-700 rounded-lg text-green-200 text-sm">✓ {success}</div>}
        {error && <div className="p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm">{error}</div>}

        {/* Informações */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold">Informações</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Título</label>
            <input
              type="text"
              value={mangaName}
              onChange={e => setMangaName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Autor</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Ex: Kentaro Miura"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Progresso de volumes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
          <h2 className="text-lg font-bold">Volumes que você tem</h2>

          {progresso !== null && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progresso</span>
                <span className="text-purple-400 font-medium">{progresso}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{volumesLidos}</p>
              <p className="text-gray-400 text-xs mt-1">Volumes que tem</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{totalVolumes || '?'}</p>
              <p className="text-gray-400 text-xs mt-1">Total da obra</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{volumesFaltam ?? '?'}</p>
              <p className="text-gray-400 text-xs mt-1">Faltam</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Total de volumes da obra</label>
            <input
              type="number"
              min={1}
              placeholder="Ex: 42"
              value={totalVolumes}
              onChange={e => {
                setTotalVolumes(e.target.value)
                if (e.target.value !== '') {
                  const newTotal = parseInt(e.target.value)
                  setOwnedVolumes(prev => prev.filter(v => v <= newTotal))
                }
              }}
              className="w-40 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
            />
          </div>

          {totalVolsNum > 0 && (
            <div className="flex flex-col gap-3">
              <label className="text-sm text-gray-400">Selecione os volumes que você tem:</label>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {volumeArray.map(vol => (
                  <button
                    key={vol}
                    onClick={() => toggleVolume(vol)}
                    className={`p-2 rounded-lg font-medium text-sm transition ${
                      ownedVolumes.includes(vol)
                        ? 'bg-purple-600 text-white border border-purple-500'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-purple-500'
                    }`}
                  >
                    {vol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avaliação por volume — estilo SeriesGraph */}
        {ownedVolumes.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-bold">Avaliação por Volume</h2>
              {/* Legenda */}
              <div className="flex gap-3 flex-wrap">
                {NOTE_CONFIG.map(n => (
                  <div key={n.label} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm ${n.color}`} />
                    <span className="text-xs text-gray-400">{n.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
  {ownedVolumes.map(vol => {
    const rating = pendingRatings[vol]
    const cfg = rating !== undefined ? getNoteConfig(rating) : null
    return (
      <div key={vol} className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-500">Vol.{vol}</span>
        <div className={`w-full rounded-lg p-2 border-2 transition ${
          cfg ? `${cfg.color} border-transparent` : 'bg-gray-800 border-gray-700'
        }`}>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            placeholder="?"
            value={rating ?? ''}
            onChange={e => {
              const val = e.target.value
              if (val === '') {
                const next = { ...pendingRatings }
                delete next[vol]
                setPendingRatings(next)
              } else {
                const num = Math.min(10, Math.max(0, parseFloat(val)))
                setPendingRatings(p => ({ ...p, [vol]: num }))
              }
            }}
            className="w-full bg-transparent text-white font-bold text-center text-sm outline-none"
          />
        </div>
        {cfg && <span className="text-xs text-gray-500">{cfg.label}</span>}
      </div>
    )
  })}
</div>

            <p className="text-xs text-gray-500">
              Clique em um volume para dar nota. Clique novamente para mudar. As notas são salvas ao clicar em "Salvar alterações".
            </p>

            {/* Média das notas */}
            {Object.keys(pendingRatings).length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Média dos volumes avaliados</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {(Object.values(pendingRatings).reduce((a, b) => a + b, 0) / Object.values(pendingRatings).length).toFixed(1)}
                  </p>
                </div>
                <div className="text-gray-500 text-sm">
                  {Object.keys(pendingRatings).length} de {ownedVolumes.length} volumes avaliados
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status e nota geral */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
          <h2 className="text-lg font-bold">Status e Avaliação Geral</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Status de leitura</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(s => (
                <button
                  key={s}
                  onClick={() => setMangaStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    mangaStatus === s
                      ? STATUS_CONFIG[s].btn + ' text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Nota geral (0 a 10)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                placeholder="Ex: 9.5"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-28 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
              />
              {note !== '' && <span className="text-yellow-400 font-bold text-lg">⭐ {note}/10</span>}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-lg transition"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>

      </main>
    </div>
  )
}