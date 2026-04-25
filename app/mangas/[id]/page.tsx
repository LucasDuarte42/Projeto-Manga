'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Manga {
  id:           string
  name:         string
  volume:       number
  totalVolumes: number | null
  status:       'READ' | 'READING' | 'WANT_TO_READ'
  note:         number | null
  coverUrl:     string | null
  genre:        string | null
  createdAt:    string
  updatedAt:    string
}

const STATUS_CONFIG = {
  READ:         { label: 'Lido',      color: 'bg-green-900 text-green-200',  btn: 'bg-green-700 hover:bg-green-600'  },
  READING:      { label: 'Lendo',     color: 'bg-yellow-900 text-yellow-200', btn: 'bg-yellow-700 hover:bg-yellow-600' },
  WANT_TO_READ: { label: 'Quero Ler', color: 'bg-blue-900 text-blue-200',    btn: 'bg-blue-700 hover:bg-blue-600'    },
}

export default function MangaDetailPage() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const params  = useParams()
  const id      = params.id as string

  const [manga,    setManga]    = useState<Manga | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  // Campos editáveis
  const [mangaName,    setMangaName]    = useState<string>('')
  const [volume,       setVolume]       = useState(1)
  const [totalVolumes, setTotalVolumes] = useState<string>('')
  const [mangaStatus,  setMangaStatus]  = useState<'READ' | 'READING' | 'WANT_TO_READ'>('WANT_TO_READ')
  const [note,         setNote]         = useState<string>('')
  const [genre,        setGenre]        = useState<string>('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) fetchManga()
  }, [status, id])

  async function fetchManga() {
    try {
      setLoading(true)
      const res = await fetch(`/api/mangas/${id}`)
      if (!res.ok) throw new Error('Mangá não encontrado')
      const data: Manga = await res.json()
      setManga(data)
      // Popula os campos com os valores atuais
      setMangaName(data.name)
      setVolume(data.volume)
      setTotalVolumes(data.totalVolumes?.toString() ?? '')
      setMangaStatus(data.status)
      setNote(data.note?.toString() ?? '')
      setGenre(data.genre ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mangá')
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
      const res = await fetch(`/api/mangas/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         mangaName,
          volume,
          totalVolumes: totalVolumes !== '' ? parseInt(totalVolumes) : null,
          status:       mangaStatus,
          note:         note !== '' ? parseFloat(note) : null,
          genre:        genre || null,
          coverUrl:     manga.coverUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')

      setManga(data)
      setSuccess('Salvo com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja remover este mangá da coleção?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/mangas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')
      router.push('/mangas')
    } catch {
      setError('Erro ao deletar mangá')
      setDeleting(false)
    }
  }

  // Calcula volumes lidos e faltantes
  const volumesLidos   = volume
  const volumesFaltam  = totalVolumes !== '' && parseInt(totalVolumes) > volume
    ? parseInt(totalVolumes) - volume
    : null
  const progresso      = totalVolumes !== '' && parseInt(totalVolumes) > 0
    ? Math.round((volume / parseInt(totalVolumes)) * 100)
    : null

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error && !manga) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link href="/mangas" className="text-purple-400 hover:text-purple-300">← Voltar para coleção</Link>
        </div>
      </div>
    )
  }

  if (!manga) return null

  const badge = STATUS_CONFIG[manga.status]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
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

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Cabeçalho do mangá */}
        <div className="flex gap-6">
          {/* Capa */}
          <div className="flex-shrink-0 w-32 h-44 bg-gradient-to-br from-purple-900 to-gray-900 rounded-xl overflow-hidden">
            {manga.coverUrl ? (
              <img src={manga.coverUrl} alt={mangaName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500 text-xs text-center">Sem capa</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center gap-2">
            <h1 className="text-2xl font-bold text-white">{mangaName}</h1>
            {genre && <p className="text-purple-400 text-sm">{genre}</p>}
            <span className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
            <p className="text-gray-500 text-xs mt-1">
              Adicionado em {new Date(manga.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div className="p-3 bg-green-900 border border-green-700 rounded-lg text-green-200 text-sm">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Card de informações básicas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white">Informações</h2>

          {/* Nome do mangá */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Título</label>
            <input
              type="text"
              placeholder="Ex: Naruto"
              value={mangaName}
              onChange={(e) => setMangaName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Gênero */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Gênero</label>
            <input
              type="text"
              placeholder="Ex: Ação, Aventura"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Card de volumes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white">Progresso de Leitura</h2>

          {/* Barra de progresso */}
          {progresso !== null && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progresso</span>
                <span className="text-purple-400 font-medium">{progresso}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          )}

          {/* Resumo rápido */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{volumesLidos}</p>
              <p className="text-gray-400 text-xs mt-1">Volumes lidos</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {totalVolumes !== '' ? totalVolumes : '?'}
              </p>
              <p className="text-gray-400 text-xs mt-1">Total de volumes</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {volumesFaltam !== null ? volumesFaltam : '?'}
              </p>
              <p className="text-gray-400 text-xs mt-1">Faltam</p>
            </div>
          </div>

          {/* Controle de volume atual */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Volume atual lido</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setVolume(v => Math.max(1, v - 1))}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg transition flex items-center justify-center"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={totalVolumes !== '' ? parseInt(totalVolumes) : undefined}
                value={volume}
                onChange={(e) => setVolume(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
              />
              <button
                onClick={() => setVolume(v => totalVolumes !== '' ? Math.min(parseInt(totalVolumes), v + 1) : v + 1)}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg transition flex items-center justify-center"
              >
                +
              </button>
              <span className="text-gray-500 text-sm">
                {totalVolumes !== '' ? `de ${totalVolumes}` : 'volumes'}
              </span>
            </div>
          </div>

          {/* Total de volumes */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Total de volumes da obra</label>
            <input
              type="number"
              min={volume}
              placeholder="Ex: 42"
              value={totalVolumes}
              onChange={(e) => setTotalVolumes(e.target.value)}
              className="w-40 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
            />
            <p className="text-gray-600 text-xs">Deixe em branco se não souber</p>
          </div>
        </div>

        {/* Card de status e nota */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white">Status e Avaliação</h2>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Status de leitura</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((s) => (
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

          {/* Nota */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Sua nota (0 a 10)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                placeholder="Ex: 9.5"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-28 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition"
              />
              {note !== '' && (
                <span className="text-yellow-400 font-bold text-lg">⭐ {note}/10</span>
              )}
            </div>
          </div>
        </div>

        {/* Botão salvar */}
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
