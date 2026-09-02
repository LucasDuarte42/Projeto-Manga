'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Library,
  Minus,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Baloo_2, Inter } from 'next/font/google'
import LogoutButton from '@/components/LogoutButton'
import RatingShareCard from '@/components/RatingShareCard'

const display = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

type MangaStatus = 'READ' | 'READING' | 'WANT_TO_READ'

interface Manga {
  id: string
  name: string
  author: string | null
  volume: number
  totalVolumes: number | null
  ownedVolumes: number[]
  totalChapters: number | null
  readChapters: number[]
  status: MangaStatus | null
  isInWishlist: boolean
  note: number | null
  coverUrl: string | null
  genre: string | null
  createdAt: string
}

interface VolumeRating {
  volume: number
  note: number
}

interface ChapterRating {
  chapter: number
  note: number
}

const STATUS_CONFIG: Record<
  MangaStatus,
  {
    label: string
    icon: typeof Check
    badge: string
    button: string
  }
> = {
  READ: {
    label: 'Lido',
    icon: Check,
    badge:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    button:
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  },

  READING: {
    label: 'Lendo',
    icon: BookOpen,
    badge:
      'border-amber-500/20 bg-amber-500/10 text-amber-300',
    button:
      'border-amber-500/40 bg-amber-500/15 text-amber-300',
  },

  WANT_TO_READ: {
    label: 'Lista de desejos',
    icon: Clock3,
    badge:
      'border-purple-500/20 bg-purple-500/10 text-purple-300',
    button:
      'border-purple-500/40 bg-purple-500/15 text-purple-300',
  },
}

function getRatingConfig(rating: number) {
  if (rating >= 8) {
    return {
      label: 'Ótimo',
      color: 'bg-emerald-500',
    }
  }

  if (rating >= 6) {
    return {
      label: 'Bom',
      color: 'bg-amber-500',
    }
  }

  if (rating >= 4) {
    return {
      label: 'Regular',
      color: 'bg-orange-500',
    }
  }

  return {
    label: 'Ruim',
    color: 'bg-rose-500',
  }
}

export default function MangaDetailPage() {
  const { data: session, status } = useSession()

  const router = useRouter()
  const params = useParams()

  const id = params.id as string

  const [manga, setManga] = useState<Manga | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showDelete, setShowDelete] = useState(false)
  const [showBulkRatingDialog, setShowBulkRatingDialog] = useState(false)
  const [bulkRatingTarget, setBulkRatingTarget] = useState<'volumes' | 'chapters'>('volumes')
  const [bulkNote, setBulkNote] = useState('')

  const [mangaName, setMangaName] = useState('')
  const [author, setAuthor] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [totalVolumes, setTotalVolumes] = useState('')
  const [ownedVolumes, setOwnedVolumes] = useState<number[]>([])
  const [totalChapters, setTotalChapters] = useState('')
  const [readChapters, setReadChapters] = useState<number[]>([])
  const [pendingChapterRatings, setPendingChapterRatings] = useState<Record<number, number>>({})
  const [activeTracker, setActiveTracker] = useState<'volumes' | 'chapters'>('volumes')

  const [mangaStatus, setMangaStatus] =
    useState<MangaStatus | null>(null)

  const [note, setNote] = useState('')

  const [pendingRatings, setPendingRatings] =
    useState<Record<number, number>>({})
  const [savedSnapshot, setSavedSnapshot] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchAll()
    }
  }, [status, id])

  async function fetchAll() {
    try {
      setLoading(true)
      setError(null)

      const [mangaRes, ratingsRes, chapterRatingsRes] = await Promise.all([
        fetch(`/api/mangas/${id}`),
        fetch(`/api/mangas/${id}/volumes`),
        fetch(`/api/mangas/${id}/chapters`),
      ])

      if (!mangaRes.ok) {
        throw new Error('Mangá não encontrado')
      }

      const mangaData: Manga = await mangaRes.json()

      let ratingsData: VolumeRating[] = []
      let chapterRatingsData: ChapterRating[] = []

      if (ratingsRes.ok) ratingsData = await ratingsRes.json()
      if (chapterRatingsRes.ok) chapterRatingsData = await chapterRatingsRes.json()

      setManga(mangaData)

      setMangaName(mangaData.name)

      setAuthor(mangaData.author ?? '')
      setCoverUrl(mangaData.coverUrl ?? '')

      setTotalVolumes(
        mangaData.totalVolumes?.toString() ?? ''
      )

      setOwnedVolumes(mangaData.ownedVolumes ?? [])
      setTotalChapters(mangaData.totalChapters?.toString() ?? '')
      setReadChapters(mangaData.readChapters ?? [])

      setMangaStatus(mangaData.status)

      setNote(
        mangaData.note !== null
          ? mangaData.note.toString()
          : ''
      )

      const ratingsMap: Record<number, number> = {}

      ratingsData.forEach((rating) => {
        ratingsMap[rating.volume] = rating.note
      })

      setPendingRatings(ratingsMap)

      const chapterRatingsMap: Record<number, number> = {}
      chapterRatingsData.forEach((rating) => {
        chapterRatingsMap[rating.chapter] = rating.note
      })
      setPendingChapterRatings(chapterRatingsMap)
      setSavedSnapshot(JSON.stringify({
        mangaName: mangaData.name,
        author: mangaData.author ?? '',
        coverUrl: mangaData.coverUrl ?? '',
        totalVolumes: mangaData.totalVolumes?.toString() ?? '',
        ownedVolumes: mangaData.ownedVolumes ?? [],
        mangaStatus: mangaData.status,
        totalChapters: mangaData.totalChapters?.toString() ?? '',
        readChapters: mangaData.readChapters ?? [],
        pendingRatings: ratingsMap,
        pendingChapterRatings: chapterRatingsMap,
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar o mangá'
      )
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
      const finalStatus: MangaStatus | null = mangaStatus

      const total =
        totalVolumes !== ''
          ? Number(totalVolumes)
          : null

      const response = await fetch(`/api/mangas/${id}`, {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: mangaName.trim(),

          author:
            author.trim() !== ''
              ? author.trim()
              : null,

          volume:
            ownedVolumes.length > 0
              ? Math.max(...ownedVolumes)
              : manga.volume,

          totalVolumes: total,
          totalChapters: totalChapters !== '' ? Number(totalChapters) : null,
          readChapters,

          ownedVolumes,

          status: finalStatus,

          genre: manga.genre,

          coverUrl: coverUrl.trim() || null,
        }),
      })

      if (!response.ok) {
        let message = 'Erro ao salvar as alterações'
        try {
          const data = await response.json()
          if (typeof data.error === 'string') message = data.error
        } catch {
          // Mantém a mensagem padrão quando a API não retorna JSON.
        }
        throw new Error(message)
      }

      const updatedManga: Manga =
        await response.json()

      const ratingRequests = Object.entries(
        pendingRatings
      ).filter(([volume]) => ownedVolumes.includes(Number(volume))).map(([volume, rating]) => {
        return fetch(`/api/mangas/${id}/volumes`, {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            volume: Number(volume),
            note: rating,
          }),
        })
      })

      const ratingResponses = await Promise.all(ratingRequests)
      const failedRating = ratingResponses.find((ratingResponse) => !ratingResponse.ok)
      if (failedRating) throw new Error('Não foi possível salvar uma avaliação de volume.')

      const chapterRatingRequests = Object.entries(pendingChapterRatings)
        .filter(([chapter]) => readChapters.includes(Number(chapter)))
        .map(([chapter, rating]) => fetch(`/api/mangas/${id}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapter: Number(chapter), note: rating }),
        }))

      const chapterRatingResponses = await Promise.all(chapterRatingRequests)
      const failedChapterRating = chapterRatingResponses.find((ratingResponse) => !ratingResponse.ok)
      if (failedChapterRating) throw new Error('Não foi possível salvar uma avaliação de capítulo.')

      setManga(updatedManga)
      setCoverUrl(updatedManga.coverUrl ?? '')

      setMangaStatus(updatedManga.status)

      setSavedSnapshot(currentDraftSnapshot)
      setSuccess('Alterações salvas com sucesso!')

      window.setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao salvar'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleWishlistToggle() {
    if (!manga) return
    const nextValue = !manga.isInWishlist
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/mangas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isInWishlist: nextValue }),
      })
      if (!response.ok) throw new Error('Não foi possível atualizar a Lista de desejos.')
      const updatedManga: Manga = await response.json()
      setManga(updatedManga)
      setSuccess(nextValue ? 'Obra adicionada à Lista de desejos.' : 'Obra removida da Lista de desejos.')
      window.setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar a Lista de desejos.')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/mangas/${id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao remover o mangá')
      }

      router.push('/mangas')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao remover'
      )

      setDeleting(false)
      setShowDelete(false)
    }
  }

  function openBulkRatingDialog(target: 'volumes' | 'chapters') {
    setBulkRatingTarget(target)
    setBulkNote('')
    setShowBulkRatingDialog(true)
  }

  function applyRatingToAllChapters() {
    if (bulkNote === '' || readChapters.length === 0) return
    const parsed = Number(bulkNote)
    if (Number.isNaN(parsed)) return
    const limited = Math.min(10, Math.max(0, parsed))
    const nextRatings: Record<number, number> = {}
    readChapters.forEach((chapter) => { nextRatings[chapter] = limited })
    setPendingChapterRatings(nextRatings)
    setShowBulkRatingDialog(false)
    setSuccess(`Nota ${limited.toFixed(1)} aplicada a todos os capítulos lidos. Clique em salvar para confirmar.`)
  }

  function applyRatingToAllVolumes() {
    if (bulkNote === '' || ownedVolumes.length === 0) return

    const parsed = Number(bulkNote)
    if (Number.isNaN(parsed)) return

    const limited = Math.min(10, Math.max(0, parsed))
    const nextRatings: Record<number, number> = {}
    ownedVolumes.forEach((volume) => {
      nextRatings[volume] = limited
    })

    setPendingRatings(nextRatings)
    setShowBulkRatingDialog(false)
    setSuccess(`Nota ${limited.toFixed(1)} aplicada a todos os volumes. Clique em salvar para confirmar.`)
  }

  function markAllChaptersRead() {
    setReadChapters(chapterArray)
    setSuccess('Todos os capítulos foram marcados como lidos. Clique em salvar para confirmar.')
  }

  function markAllVolumesOwned() {
    setOwnedVolumes(volumeArray)
    setSuccess('Todos os volumes foram marcados como pertencentes à sua coleção. Clique em salvar para confirmar.')
  }

  function toggleChapter(chapter: number) {
    setReadChapters((current) => current.includes(chapter)
      ? current.filter((item) => item !== chapter)
      : [...current, chapter].sort((a, b) => a - b))
  }

  function toggleVolume(volume: number) {
    setOwnedVolumes((current) => {
      if (current.includes(volume)) {
        return current.filter(
          (item) => item !== volume
        )
      }

      return [...current, volume].sort(
        (a, b) => a - b
      )
    })
  }

  function increaseTotal() {
    const current =
      totalVolumes !== ''
        ? Number(totalVolumes)
        : 0

    setTotalVolumes(
      String(Math.max(1, current + 1))
    )
  }

  function decreaseTotal() {
    const current =
      totalVolumes !== ''
        ? Number(totalVolumes)
        : 1

    const newTotal = Math.max(1, current - 1)

    setTotalVolumes(String(newTotal))

    setOwnedVolumes((currentVolumes) =>
      currentVolumes.filter(
        (volume) => volume <= newTotal
      )
    )

    setPendingRatings((currentRatings) => {
      const nextRatings: Record<number, number> = {}

      Object.entries(currentRatings).forEach(
        ([volume, rating]) => {
          if (Number(volume) <= newTotal) {
            nextRatings[Number(volume)] = rating
          }
        }
      )

      return nextRatings
    })
  }

  const totalVolsNum =
    totalVolumes !== ''
      ? Math.max(0, Number(totalVolumes))
      : 0

  const volumeArray = Array.from(
    { length: totalVolsNum },
    (_, index) => index + 1
  )

  const totalChaptersNum = totalChapters !== ''
    ? Math.max(0, Number(totalChapters))
    : 0

  const chapterArray = Array.from(
    { length: totalChaptersNum },
    (_, index) => index + 1
  )

  const chaptersRead = readChapters.length

  const currentDraftSnapshot = useMemo(() => JSON.stringify({
    mangaName,
    author,
    coverUrl,
    totalVolumes,
    ownedVolumes,
    mangaStatus,
    totalChapters,
    readChapters,
    pendingRatings,
    pendingChapterRatings,
  }), [mangaName, author, coverUrl, totalVolumes, ownedVolumes, mangaStatus, totalChapters, readChapters, pendingRatings, pendingChapterRatings])

  const hasUnsavedChanges = savedSnapshot !== '' && savedSnapshot !== currentDraftSnapshot

  const volumesOwned = ownedVolumes.length

  const volumesMissing =
    totalVolsNum > 0
      ? Math.max(
          0,
          totalVolsNum - volumesOwned
        )
      : null

  const progress =
    totalVolsNum > 0
      ? Math.min(
          100,
          Math.round(
            (volumesOwned / totalVolsNum) * 100
          )
        )
      : 0

  const average = useMemo(() => {
    const ratings = ownedVolumes
      .map((volume) => pendingRatings[volume])
      .filter((rating): rating is number => rating !== undefined)

    if (ratings.length === 0) {
      return '—'
    }

    const total = ratings.reduce(
      (sum, rating) => sum + rating,
      0
    )

    return (
      total / ratings.length
    ).toFixed(1)
  }, [pendingRatings])

  if (
    status === 'loading' ||
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (!manga) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-center text-gray-400">
        {error ?? 'Mangá não encontrado'}
      </div>
    )
  }

  const currentStatus = mangaStatus
    ? STATUS_CONFIG[mangaStatus]
    : {
        label: 'Sem status',
        icon: Clock3,
        badge: 'border-white/10 bg-white/[0.04] text-gray-400',
        button: 'border-white/10 bg-white/[0.025] text-gray-500',
      }

  const StatusIcon = currentStatus.icon

  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen overflow-x-hidden bg-gray-950 text-white [font-family:var(--font-body)]`}
    >
      {/* Background */}
      <div className="pointer-events-none fixed -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-purple-600/[0.08] blur-[140px]" />

      <div className="pointer-events-none fixed -right-48 top-40 h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.06] blur-[140px]" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/mangas"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 transition hover:border-purple-500/50 hover:bg-purple-500/10"
            >
              <ArrowLeft
                size={18}
                className="text-gray-400 transition group-hover:-translate-x-0.5 group-hover:text-purple-400"
              />
            </Link>

            <div>
              <h1 className="text-base font-bold text-white sm:text-lg">
                Minha coleção
              </h1>

              <p className="text-xs text-gray-500">
                Detalhes do mangá
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDelete(true)}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-sm font-medium text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <Trash2 size={17} />

              <span className="hidden sm:inline">
                Remover
              </span>
            </button>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
        {/* Hero */}
        <section className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-end">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/40">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={mangaName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-gray-900">
                <BookOpen
                  size={48}
                  className="text-purple-400/40"
                />

                <span className="mt-4 text-sm text-gray-500">
                  Sem capa
                </span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${currentStatus.badge}`}
              >
                <StatusIcon size={14} />

                {currentStatus.label}
              </span>

              <button type="button" onClick={() => void handleWishlistToggle()} disabled={saving} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${manga.isInWishlist ? 'border-purple-400/40 bg-purple-500/15 text-purple-200' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-purple-400/40 hover:text-purple-200'} disabled:cursor-not-allowed disabled:opacity-50`} aria-pressed={manga.isInWishlist}>
                <Clock3 size={14} />
                {manga.isInWishlist ? 'Na lista de desejos' : 'Adicionar à lista de desejos'}
              </button>

              <span className="text-xs text-gray-500">
                Adicionado em{' '}
                {new Date(
                  manga.createdAt
                ).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div>
              <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl [font-family:var(--font-display)]">
                {mangaName || 'Sem título'}
              </h1>

              {author && (
                <p className="mt-3 text-lg text-purple-300">
                  {author}
                </p>
              )}

              <p className="mt-5 max-w-2xl leading-7 text-gray-400">
                Acompanhe sua coleção, registre cada
                volume e mantenha sua experiência de
                leitura organizada.
              </p>
            </div>

           
          </div>
        </section>

        {/* Feedback */}
        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300">
            <Check size={18} />

            {success}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] p-4 text-sm text-rose-300">
            <CircleAlert size={18} />

            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Na coleção
            </p>

            <p className="mt-3 text-3xl font-bold text-purple-300">
              {volumesOwned}{' '}
              <span className="text-xl text-gray-500">
                volumes
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Progresso
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
              {progress}%
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Faltam
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-300">
              {volumesMissing ?? '?'}{' '}
              <span className="text-xl text-gray-500">
                volumes
              </span>
            </p>
          </div>
        </section>

        {/* Tracking mode */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Forma de acompanhar</p>
              <p className="mt-1 text-sm text-gray-400">Escolha se deseja controlar volumes ou capítulos.</p>
            </div>
            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button type="button" onClick={() => setActiveTracker('volumes')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTracker === 'volumes' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Volumes</button>
              <button type="button" onClick={() => setActiveTracker('chapters')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTracker === 'chapters' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Capítulos</button>
            </div>
          </div>
        </section>

        {hasUnsavedChanges && (
          <div className="sticky top-20 z-10 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/40 transition hover:from-purple-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}

        {/* Collection + Info */}
        <section className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
          {/* Volumes */}
          <div className={`${activeTracker === 'volumes' ? '' : 'hidden'} rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8`}>
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
                  Coleção
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white [font-family:var(--font-display)]">
                  Volumes que você tem
                </h2>
              </div>

              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-gray-400">
                {volumesOwned} / {totalVolsNum}
              </span>
            </div>

            <div className="mb-7 flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <span className="font-mono text-sm text-purple-300">
                {progress}%
              </span>
            </div>

            {/* Total selector */}
            <div className="mb-7 flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-400">
                Total de volumes
              </span>

              <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={decreaseTotal}
                  className="p-2.5 text-gray-400 transition hover:text-white"
                  aria-label="Diminuir total"
                >
                  <Minus size={16} />
                </button>

                <input
                  type="number"
                  min="1"
                  value={totalVolumes}
                  onChange={(event) => {
                    const value =
                      event.target.value

                    setTotalVolumes(value)

                    if (value !== '') {
                      const newTotal =
                        Math.max(
                          1,
                          Number(value)
                        )

                      setOwnedVolumes(
                        (current) =>
                          current.filter(
                            (volume) =>
                              volume <= newTotal
                          )
                      )

                      setPendingRatings(
                        (current) => {
                          const next: Record<
                            number,
                            number
                          > = {}

                          Object.entries(
                            current
                          ).forEach(
                            ([
                              volume,
                              rating,
                            ]) => {
                              if (
                                Number(volume) <=
                                newTotal
                              ) {
                                next[
                                  Number(volume)
                                ] = rating
                              }
                            }
                          )

                          return next
                        }
                      )
                    }
                  }}
                  className="w-14 bg-transparent text-center text-sm font-medium text-white outline-none"
                />

                <button
                  type="button"
                  onClick={increaseTotal}
                  className="p-2.5 text-gray-400 transition hover:text-white"
                  aria-label="Aumentar total"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button type="button" onClick={markAllVolumesOwned} disabled={volumeArray.length === 0} className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                Tenho todos os volumes
              </button>
            </div>

            {totalVolsNum > 0 && (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                {volumeArray.map((volume) => {
                  const isOwned = ownedVolumes.includes(volume)
                  return (
                    <button
                      key={volume}
                      type="button"
                      onClick={() => toggleVolume(volume)}
                      aria-pressed={isOwned}
                      className={`aspect-square rounded-xl border text-sm font-semibold transition ${
                        isOwned
                          ? 'border-purple-400/30 bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-900/30'
                          : 'border-white/10 bg-white/[0.025] text-gray-500 hover:border-purple-500/40 hover:bg-purple-500/[0.06] hover:text-gray-200'
                      }`}
                    >
                      {volume}
                    </button>
                  )
                })}
              </div>
            )}

            {totalVolsNum === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
                Defina o total de volumes para
                começar sua coleção.
              </div>
            )}
          </div>

          {/* Chapters */}
          <div className={`${activeTracker === 'chapters' ? '' : 'hidden'} rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Coleção</p>
                <h2 className="mt-2 text-2xl font-bold text-white [font-family:var(--font-display)]">Capítulos lidos</h2>
                <p className="mt-2 text-sm text-gray-500">Selecione os capítulos lidos e depois atribua uma nota individual a cada um.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-gray-400">{chaptersRead} / {totalChaptersNum}</span>
                <button type="button" onClick={markAllChaptersRead} disabled={chapterArray.length === 0} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40">Li todos os capítulos</button>
              </div>
            </div>

            <label className="mt-7 flex max-w-xs flex-col gap-2">
              <span className="text-sm text-gray-400">Total de capítulos</span>
              <input type="number" min="1" value={totalChapters} onChange={(event) => {
                const value = event.target.value
                setTotalChapters(value)
                const nextTotal = value === '' ? 0 : Math.max(1, Number(value))
                setReadChapters((current) => current.filter((chapter) => chapter <= nextTotal))
                setPendingChapterRatings((current) => Object.fromEntries(Object.entries(current).filter(([chapter]) => Number(chapter) <= nextTotal)))
              }} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none focus:border-purple-500/60" />
            </label>

            {chapterArray.length > 0 ? (
              <>
                <div className="mt-7 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                  {chapterArray.map((chapter) => {
                    const isRead = readChapters.includes(chapter)
                    return <button key={chapter} type="button" onClick={() => toggleChapter(chapter)} aria-pressed={isRead} className={`aspect-square rounded-xl border text-xs font-semibold transition ${isRead ? 'border-emerald-400/30 bg-emerald-500 text-gray-950' : 'border-white/10 bg-white/[0.025] text-gray-500 hover:border-purple-500/40 hover:text-white'}`}>C{chapter}</button>
                  })}
                </div>
                {readChapters.length > 0 && <div className="mt-8 border-t border-white/10 pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-white">Notas dos capítulos lidos</h3><button type="button" onClick={() => openBulkRatingDialog('chapters')} disabled={readChapters.length === 0} className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40">Dar nota para todos</button></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6"><>{readChapters.map((chapter) => { const rating = pendingChapterRatings[chapter]; const config = rating !== undefined ? getRatingConfig(rating) : null; return <label key={chapter} className="flex flex-col gap-2"><span className="font-mono text-xs text-gray-500">Cap. {chapter}</span><div className={`rounded-xl border p-2 ${config ? `${config.color} border-transparent` : 'border-white/10 bg-white/[0.04]'}`}><input type="number" min="0" max="10" step="0.5" value={rating ?? ''} placeholder="—" onChange={(event) => { const value = event.target.value; setPendingChapterRatings((current) => { const next = { ...current }; if (value === '') delete next[chapter]; else { const parsed = Number(value); if (!Number.isNaN(parsed)) next[chapter] = Math.min(10, Math.max(0, parsed)) }; return next }) }} className="w-full bg-transparent text-center text-sm font-bold text-white outline-none placeholder:text-white/40" aria-label={`Nota do capítulo ${chapter}`} /></div>{config && <span className="text-center text-[10px] text-gray-500">{config.label}</span>}</label> })}</></div></div>}
              </>
            ) : <div className="mt-7 rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">Defina o total de capítulos para começar.</div>}
          </div>

          {/* Information */}
          <div
            id="informacoes"
            className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
              Informações
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white [font-family:var(--font-display)]">
              Sobre a obra
            </h2>

            <div className="mt-7 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-gray-400">
                  Título
                </span>

                <input
                  value={mangaName}
                  onChange={(event) =>
                    setMangaName(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/60 focus:bg-white/[0.06]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-gray-400">
                  Autor
                </span>

                <input
                  value={author}
                  onChange={(event) =>
                    setAuthor(
                      event.target.value
                    )
                  }
                  placeholder="Ex: Kentaro Miura"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/60 focus:bg-white/[0.06]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-gray-400">URL HTTPS da capa</span>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(event) => setCoverUrl(event.target.value)}
                  placeholder="https://..."
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/60 focus:bg-white/[0.06]"
                />
                <span className="text-xs text-gray-500">Cole uma URL HTTPS. Deixe em branco para remover a capa.</span>
                {coverUrl.trim() && (
                  <img
                    src={coverUrl}
                    alt="Pré-visualização da capa"
                    className="mt-1 h-32 w-24 rounded-xl object-cover"
                    onError={(event) => { event.currentTarget.style.display = 'none' }}
                  />
                )}
              </label>

              <div>
                <p className="mb-3 text-sm text-gray-400">
                  Status de leitura
                </p>

                <div className="flex flex-wrap gap-2">
                  {(
                    Object.keys(
                      STATUS_CONFIG
                    ) as MangaStatus[]
                  ).map((statusKey) => {
                    const config =
                      STATUS_CONFIG[statusKey]

                    return (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() => {
                          setMangaStatus(statusKey)
                          if (statusKey === 'WANT_TO_READ' && !manga.isInWishlist) {
                            void handleWishlistToggle()
                          }
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                          mangaStatus ===
                          statusKey
                            ? config.button
                            : 'border-white/10 bg-white/[0.025] text-gray-500 hover:border-white/20 hover:text-gray-300'
                        }`}
                      >
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Volume ratings */}
        {activeTracker === 'volumes' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
                  Avaliações
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white [font-family:var(--font-display)]">
                  Nota por volume
                </h2>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Star
                  size={20}
                  className="fill-purple-400 text-purple-400"
                />

                <div>
                  <p className="font-mono text-xl font-bold text-white">
                    {average}
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-gray-500">
                    Média
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {ownedVolumes.map(
                (volume) => {
                  const rating =
                    pendingRatings[volume]

                  const config =
                    rating !== undefined
                      ? getRatingConfig(
                          rating
                        )
                      : null

                  return (
                    <label
                      key={volume}
                      className="flex flex-col gap-2"
                    >
                      <span className="font-mono text-xs text-gray-500">
                        Vol. {volume}
                      </span>

                      <div
                        className={`rounded-xl border p-2 transition ${
                          config
                            ? `${config.color} border-transparent`
                            : 'border-white/10 bg-white/[0.04]'
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          placeholder="—"
                          value={
                            rating ?? ''
                          }
                          onChange={(
                            event
                          ) => {
                            const value =
                              event.target.value

                            if (
                              value === ''
                            ) {
                              setPendingRatings(
                                (current) => {
                                  const next = {
                                    ...current,
                                  }

                                  delete next[
                                    volume
                                  ]

                                  return next
                                }
                              )

                              return
                            }

                            const parsed =
                              Number(value)

                            if (
                              Number.isNaN(
                                parsed
                              )
                            ) {
                              return
                            }

                            const limited =
                              Math.min(
                                10,
                                Math.max(
                                  0,
                                  parsed
                                )
                              )

                            setPendingRatings(
                              (current) => ({
                                ...current,
                                [volume]:
                                  limited,
                              })
                            )
                          }}
                          className="w-full bg-transparent text-center text-sm font-bold text-white outline-none placeholder:text-white/40"
                        />
                      </div>

                      {config && (
                        <span className="text-center text-[10px] text-gray-500">
                          {config.label}
                        </span>
                      )}
                    </label>
                  )
                }
              )}
            </div>

            <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => openBulkRatingDialog('volumes')}
                disabled={ownedVolumes.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Star size={17} />
                Dar nota a todos os volumes
              </button>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              As avaliações aparecem somente para os volumes marcados como adquiridos e serão salvas junto com as alterações da obra.
            </p>
        </section>
        )}

        {activeTracker === 'volumes' ? (
          <RatingShareCard
            name={mangaName || manga.name}
            author={author || manga.author}
            coverUrl={manga.coverUrl ? `/api/mangas/${id}/cover` : null}
            ratings={Object.entries(pendingRatings)
              .filter(([volume]) => ownedVolumes.includes(Number(volume)))
              .map(([volume, rating]) => ({ volume: Number(volume), note: rating }))}
            expectedVolumes={ownedVolumes}
          />
        ) : (
          <RatingShareCard
            name={mangaName || manga.name}
            author={author || manga.author}
            coverUrl={manga.coverUrl ? `/api/mangas/${id}/cover` : null}
            ratings={Object.entries(pendingChapterRatings)
              .filter(([chapter]) => readChapters.includes(Number(chapter)))
              .map(([chapter, rating]) => ({ volume: Number(chapter), note: rating }))}
            expectedVolumes={readChapters}
            mode="chapters"
          />
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-4 text-base font-bold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

              Salvando...
            </>
          ) : (
            <>
              <Save size={19} />

              Salvar alterações

              <ChevronRight size={18} />
            </>
          )}
        </button>
      </main>

      {/* Bulk rating modal */}
      {showBulkRatingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="bulk-rating-title" className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Avaliação em massa</p>
                <h2 id="bulk-rating-title" className="mt-2 text-xl font-bold text-white [font-family:var(--font-display)]">Dar nota a todos os {bulkRatingTarget === 'chapters' ? 'capítulos lidos' : 'volumes que você tem'}?</h2>
              </div>
              <button type="button" onClick={() => setShowBulkRatingDialog(false)} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/5 hover:text-white"><X size={19} /></button>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-400">A nota escolhida será aplicada a {bulkRatingTarget === 'chapters' ? `${readChapters.length} capítulos lidos` : `${ownedVolumes.length} volumes que você tem`}. Você poderá ajustar cada item individualmente depois.</p>
            <label className="mt-6 flex items-center gap-3">
              <span className="text-sm text-gray-400">Nota</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={bulkNote}
                onChange={(event) => setBulkNote(event.target.value === '' ? '' : String(Math.min(10, Math.max(0, Number(event.target.value))))) }
                className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center font-mono text-lg font-bold text-white outline-none focus:border-purple-500/60"
                autoFocus
              />
              <span className="text-sm text-gray-500">/ 10</span>
            </label>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowBulkRatingDialog(false)} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white">Cancelar</button>
              <button type="button" onClick={bulkRatingTarget === 'chapters' ? applyRatingToAllChapters : applyRatingToAllVolumes} disabled={bulkNote === '' || Number.isNaN(Number(bulkNote))} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40">Aplicar nota</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-black/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
                <CircleAlert
                  size={22}
                  className="text-rose-400"
                />
              </div>

              <button
                onClick={() =>
                  setShowDelete(false)
                }
                disabled={deleting}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <h2 className="mt-5 text-xl font-bold text-white [font-family:var(--font-display)]">
              Remover da coleção?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Tem certeza que deseja remover{' '}
              <strong className="text-gray-200">
                {mangaName}
              </strong>{' '}
              da sua coleção? Esta ação não pode ser
              desfeita.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() =>
                  setShowDelete(false)
                }
                disabled={deleting}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />

                    Sim, remover
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}