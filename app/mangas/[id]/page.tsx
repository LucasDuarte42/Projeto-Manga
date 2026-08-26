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
  status: MangaStatus
  note: number | null
  coverUrl: string | null
  genre: string | null
  createdAt: string
}

interface VolumeRating {
  volume: number
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
    label: 'Quero ler',
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

  const [mangaName, setMangaName] = useState('')
  const [author, setAuthor] = useState('')
  const [totalVolumes, setTotalVolumes] = useState('')
  const [ownedVolumes, setOwnedVolumes] = useState<number[]>([])

  const [mangaStatus, setMangaStatus] =
    useState<MangaStatus>('WANT_TO_READ')

  const [note, setNote] = useState('')

  const [pendingRatings, setPendingRatings] =
    useState<Record<number, number>>({})

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

      const [mangaRes, ratingsRes] = await Promise.all([
        fetch(`/api/mangas/${id}`),
        fetch(`/api/mangas/${id}/volumes`),
      ])

      if (!mangaRes.ok) {
        throw new Error('Mangá não encontrado')
      }

      const mangaData: Manga = await mangaRes.json()

      let ratingsData: VolumeRating[] = []

      if (ratingsRes.ok) {
        ratingsData = await ratingsRes.json()
      }

      setManga(mangaData)

      setMangaName(mangaData.name)

      setAuthor(mangaData.author ?? '')

      setTotalVolumes(
        mangaData.totalVolumes?.toString() ?? ''
      )

      setOwnedVolumes(mangaData.ownedVolumes ?? [])

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
      const finalStatus: MangaStatus =
        note !== ''
          ? 'READ'
          : mangaStatus

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

          ownedVolumes,

          status: finalStatus,

          note:
            note !== ''
              ? Number(note)
              : null,

          genre: manga.genre,

          coverUrl: manga.coverUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar as alterações')
      }

      const updatedManga: Manga =
        await response.json()

      const ratingRequests = Object.entries(
        pendingRatings
      ).map(([volume, rating]) => {
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

      await Promise.all(ratingRequests)

      setManga(updatedManga)

      setMangaStatus(updatedManga.status)

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
    const ratings = Object.values(pendingRatings)

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

  const currentStatus =
    STATUS_CONFIG[mangaStatus]

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
            {manga.coverUrl ? (
              <img
                src={manga.coverUrl}
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

        {/* Collection + Info */}
        <section className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
          {/* Volumes */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
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
                        onClick={() =>
                          setMangaStatus(
                            statusKey
                          )
                        }
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
        {ownedVolumes.length > 0 && (
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

            <p className="mt-6 text-xs text-gray-500">
              As avaliações individuais serão salvas
              junto com as alterações da obra.
            </p>
          </section>
        )}

        {/* General rating */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
                Sua avaliação
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white [font-family:var(--font-display)]">
                Como foi a experiência?
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Ao adicionar uma nota geral, a obra será
                marcada automaticamente como lida.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={note}
                onChange={(event) => {
                  const value =
                    event.target.value

                  if (value === '') {
                    setNote('')
                    return
                  }

                  const parsed =
                    Number(value)

                  if (
                    !Number.isNaN(parsed)
                  ) {
                    setNote(
                      String(
                        Math.min(
                          10,
                          Math.max(
                            0,
                            parsed
                          )
                        )
                      )
                    )
                  }
                }}
                placeholder="0"
                className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center font-mono text-lg font-bold text-white outline-none transition focus:border-purple-500/60"
              />

              <span className="text-sm text-gray-500">
                / 10
              </span>

              {note !== '' && (
                <Star
                  size={22}
                  className="fill-amber-400 text-amber-400"
                />
              )}
            </div>
          </div>
        </section>

        <RatingShareCard
          name={mangaName || manga.name}
          author={author || manga.author}
          coverUrl={manga.coverUrl}
          ratings={Object.entries(pendingRatings).map(([volume, rating]) => ({
            volume: Number(volume),
            note: rating,
          }))}
          expectedVolumes={ownedVolumes}
          generalNote={note === '' ? null : Number(note)}
        />

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