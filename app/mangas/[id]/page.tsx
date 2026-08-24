'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useSession } from 'next-auth/react'
import {
  useParams,
  useRouter,
} from 'next/navigation'

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
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import {
  Baloo_2,
  Inter,
} from 'next/font/google'

const display = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

interface Manga {
  id: string
  name: string
  author: string | null
  volume: number
  totalVolumes: number | null
  ownedVolumes: number[]
  status:
    | 'READ'
    | 'READING'
    | 'WANT_TO_READ'
  note: number | null
  coverUrl: string | null
  genre: string | null
  createdAt: string
}

interface VolumeRating {
  volume: number
  note: number
}

const STATUS_CONFIG = {
  READ: {
    label: 'Lido',
    icon: Check,
    className:
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  },

  READING: {
    label: 'Lendo',
    icon: BookOpen,
    className:
      'bg-amber-500/15 text-amber-300 border-amber-500/20',
  },

  WANT_TO_READ: {
    label: 'Quero ler',
    icon: Clock3,
    className:
      'bg-sky-500/15 text-sky-300 border-sky-500/20',
  },
} as const

type MangaStatus =
  keyof typeof STATUS_CONFIG

function getRatingLabel(
  rating: number
) {
  if (rating >= 8) return 'Ótimo'
  if (rating >= 6) return 'Bom'
  if (rating >= 4) return 'Regular'

  return 'Ruim'
}

function getRatingColor(
  rating: number
) {
  if (rating >= 8) {
    return 'bg-emerald-500'
  }

  if (rating >= 6) {
    return 'bg-amber-500'
  }

  if (rating >= 4) {
    return 'bg-orange-500'
  }

  return 'bg-red-500'
}

export default function MangaDetailPage() {
  const { status } = useSession()

  const router = useRouter()
  const params = useParams()

  const id = params.id as string

  const informationRef =
    useRef<HTMLDivElement>(null)

  const [manga, setManga] =
    useState<Manga | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [deleting, setDeleting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const [showDelete, setShowDelete] =
    useState(false)

  const [mangaName, setMangaName] =
    useState('')

  const [author, setAuthor] =
    useState('')

  const [totalVolumes, setTotalVolumes] =
    useState('')

  const [ownedVolumes, setOwnedVolumes] =
    useState<number[]>([])

  const [mangaStatus, setMangaStatus] =
    useState<MangaStatus>(
      'WANT_TO_READ'
    )

  const [note, setNote] =
    useState('')

  const [
    pendingRatings,
    setPendingRatings,
  ] = useState<
    Record<number, number>
  >({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (
      status === 'authenticated' &&
      id
    ) {
      fetchAll()
    }
  }, [status, id])

  async function fetchAll() {
    try {
      setLoading(true)
      setError(null)

      const [
        mangaResponse,
        ratingsResponse,
      ] = await Promise.all([
        fetch(`/api/mangas/${id}`),
        fetch(`/api/mangas/${id}/volumes`),
      ])

      if (!mangaResponse.ok) {
        throw new Error(
          'Mangá não encontrado'
        )
      }

      if (!ratingsResponse.ok) {
        throw new Error(
          'Erro ao carregar avaliações'
        )
      }

      const mangaData: Manga =
        await mangaResponse.json()

      const ratingsData: VolumeRating[] =
        await ratingsResponse.json()

      setManga(mangaData)

      setMangaName(mangaData.name)

      setAuthor(
        mangaData.author ?? ''
      )

      setTotalVolumes(
        mangaData.totalVolumes?.toString() ??
          ''
      )

      setOwnedVolumes(
        mangaData.ownedVolumes ?? []
      )

      setMangaStatus(
        mangaData.status
      )

      setNote(
        mangaData.note?.toString() ??
          ''
      )

      const ratings: Record<
        number,
        number
      > = {}

      ratingsData.forEach((rating) => {
        ratings[rating.volume] =
          rating.note
      })

      setPendingRatings(ratings)
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

  function toggleVolume(volume: number) {
    const isOwned =
      ownedVolumes.includes(volume)

    setOwnedVolumes((current) =>
      current.includes(volume)
        ? current.filter(
            (item) =>
              item !== volume
          )
        : [
            ...current,
            volume,
          ].sort((a, b) => a - b)
    )

    if (isOwned) {
      setPendingRatings(
        (current) => {
          const next = {
            ...current,
          }

          delete next[volume]

          return next
        }
      )
    }
  }

  function updateTotalVolumes(
    value: string
  ) {
    setTotalVolumes(value)

    if (value === '') {
      return
    }

    const newTotal = Math.max(
      1,
      Number(value)
    )

    if (Number.isNaN(newTotal)) {
      return
    }

    setOwnedVolumes((current) =>
      current.filter(
        (volume) =>
          volume <= newTotal
      )
    )

    setPendingRatings((current) => {
      const next = {
        ...current,
      }

      Object.keys(next).forEach(
        (volume) => {
          if (
            Number(volume) >
            newTotal
          ) {
            delete next[
              Number(volume)
            ]
          }
        }
      )

      return next
    })
  }

  function updateRating(
    volume: number,
    value: string
  ) {
    if (value === '') {
      setPendingRatings(
        (current) => {
          const next = {
            ...current,
          }

          delete next[volume]

          return next
        }
      )

      return
    }

    const parsed = Number(value)

    if (Number.isNaN(parsed)) {
      return
    }

    const rating = Math.min(
      10,
      Math.max(0, parsed)
    )

    setPendingRatings(
      (current) => ({
        ...current,
        [volume]: rating,
      })
    )
  }

  async function handleSave() {
    if (!manga) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const finalStatus: MangaStatus =
        note !== ''
          ? 'READ'
          : mangaStatus

      /*
       * Primeiro salva o mangá.
       * Isso garante que ownedVolumes esteja
       * atualizado antes das avaliações.
       */
      const mangaResponse = await fetch(
        `/api/mangas/${id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: mangaName.trim(),

            author:
              author.trim() || null,

            volume:
              ownedVolumes.length > 0
                ? Math.max(
                    ...ownedVolumes
                  )
                : manga.volume,

            totalVolumes:
              totalVolumes !== ''
                ? Number(
                    totalVolumes
                  )
                : null,

            ownedVolumes,

            status: finalStatus,

            note:
              note !== ''
                ? Number(note)
                : null,

            genre: manga.genre,

            coverUrl: manga.coverUrl,
          }),
        }
      )

      if (!mangaResponse.ok) {
        const data =
          await mangaResponse
            .json()
            .catch(() => null)

        throw new Error(
          data?.error ||
            'Erro ao salvar o mangá'
        )
      }

      /*
       * Agora sincroniza todas as notas.
       * Notas removidas também serão
       * removidas do banco.
       */
      const ratingsResponse =
        await fetch(
          `/api/mangas/${id}/volumes`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              ratings: Object.entries(
                pendingRatings
              ).map(
                ([volume, rating]) => ({
                  volume:
                    Number(volume),

                  note: rating,
                })
              ),
            }),
          }
        )

      if (!ratingsResponse.ok) {
        const data =
          await ratingsResponse
            .json()
            .catch(() => null)

        throw new Error(
          data?.error ||
            'Erro ao salvar avaliações'
        )
      }

      const updatedManga: Manga =
        await mangaResponse.json()

      setManga(updatedManga)

      setMangaStatus(
        updatedManga.status
      )

      setSuccess(
        'Alterações salvas com sucesso.'
      )

      window.setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao salvar alterações'
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
        const data =
          await response
            .json()
            .catch(() => null)

        throw new Error(
          data?.error ||
            'Erro ao remover o mangá'
        )
      }

      router.push('/mangas')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao remover o mangá'
      )

      setDeleting(false)
      setShowDelete(false)
    }
  }

  function focusInformation() {
    informationRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  const totalVolsNum =
    totalVolumes !== ''
      ? Math.max(
          0,
          Number(totalVolumes)
        )
      : 0

  const volumeArray =
    Array.from(
      {
        length: Number.isNaN(
          totalVolsNum
        )
          ? 0
          : totalVolsNum,
      },
      (_, index) => index + 1
    )

  const volumesOwned =
    ownedVolumes.length

  const volumesMissing =
    totalVolsNum > 0
      ? Math.max(
          0,
          totalVolsNum -
            volumesOwned
        )
      : null

  const progress =
    totalVolsNum > 0
      ? Math.min(
          100,
          Math.round(
            (volumesOwned /
              totalVolsNum) *
              100
          )
        )
      : 0

  const averageRating =
    useMemo(() => {
      const values =
        Object.values(
          pendingRatings
        )

      if (!values.length) {
        return '—'
      }

      const average =
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / values.length

      return average.toFixed(1)
    }, [pendingRatings])

  const currentBadge =
    STATUS_CONFIG[mangaStatus]

  const BadgeIcon =
    currentBadge.icon

  if (
    status === 'loading' ||
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="size-12 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!manga) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">
            Mangá não encontrado
          </h1>

          <Link
            href="/mangas"
            className="mt-4 inline-flex items-center gap-2 text-primary"
          >
            <ArrowLeft className="size-4" />
            Voltar para a coleção
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-background text-foreground [font-family:var(--font-body)]`}
    >
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"
          aria-label="Navegação principal"
        >
          <Link
            href="/mangas"
            className="group flex items-center gap-3 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card transition group-hover:border-primary/60 group-hover:bg-primary/10">
              <ArrowLeft className="size-4" />
            </span>

            <span className="hidden sm:inline">
              Minha coleção
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Library className="size-4 text-primary" />

            <span className="hidden sm:inline">
              Biblioteca pessoal
            </span>

            <MoreHorizontal className="ml-1 size-4" />
          </div>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:py-12">
        {/* Cabeçalho */}
        <section className="grid gap-7 lg:grid-cols-[240px_1fr] lg:items-end">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
            {manga.coverUrl ? (
              <img
                src={manga.coverUrl}
                alt={mangaName}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/20 to-card" />

                <div className="relative flex h-full flex-col justify-between p-5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-primary-foreground/80">
                    <span>
                      Biblioteca
                    </span>

                    <span>
                      01
                    </span>
                  </div>

                  <div>
                    <p className="text-5xl font-bold tracking-tight text-primary-foreground [font-family:var(--font-display)]">
                      {mangaName
                        .charAt(0)
                        .toUpperCase()}
                    </p>

                    <p className="mt-1 text-xs uppercase tracking-[0.35em] text-primary-foreground/70">
                      {mangaName}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${currentBadge.className}`}
              >
                <BadgeIcon className="size-3.5" />

                {currentBadge.label}
              </span>

              <span className="text-xs text-muted-foreground">
                Adicionado em{' '}
                {new Date(
                  manga.createdAt
                ).toLocaleDateString(
                  'pt-BR'
                )}
              </span>
            </div>

            <div>
              <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl [font-family:var(--font-display)]">
                {mangaName ||
                  manga.name}
              </h1>

              {author && (
                <p className="mt-3 text-lg text-primary">
                  {author}
                </p>
              )}

              <p className="mt-5 max-w-2xl text-pretty leading-7 text-muted-foreground">
                Acompanhe sua coleção,
                registre cada volume e
                mantenha sua experiência de
                leitura organizada.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={
                  focusInformation
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Pencil className="size-4" />

                Editar informações
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowDelete(true)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-red-500/40 hover:text-red-400"
              >
                <Trash2 className="size-4" />

                Remover
              </button>
            </div>
          </div>
        </section>

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <Check className="size-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <CircleAlert className="size-5" />
            {error}
          </div>
        )}

        {/* Estatísticas */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Na coleção
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">
              {volumesOwned}{' '}
              volumes
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Progresso
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {totalVolsNum > 0
                ? `${progress}%`
                : '—'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Faltam
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-muted-foreground">
              {volumesMissing !== null
                ? `${volumesMissing} volumes`
                : '—'}
            </p>
          </div>
        </section>

        {/* Coleção e informações */}
        <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Coleção
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Volumes que você tem
                </h2>
              </div>

              <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                {volumesOwned} /{' '}
                {totalVolsNum || '?'}
              </span>
            </div>

            {totalVolsNum > 0 && (
              <div className="mb-7 flex items-center gap-4">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <span className="font-mono text-sm text-primary">
                  {progress}%
                </span>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <label
                htmlFor="total-volumes"
                className="text-sm text-muted-foreground"
              >
                Total de volumes
              </label>

              <div className="flex items-center rounded-lg border border-border bg-muted">
                <button
                  type="button"
                  aria-label="Diminuir total"
                  onClick={() => {
                    const current =
                      totalVolsNum || 1

                    updateTotalVolumes(
                      String(
                        Math.max(
                          1,
                          current - 1
                        )
                      )
                    )
                  }}
                  className="p-2 text-muted-foreground transition hover:text-foreground"
                >
                  <Minus className="size-4" />
                </button>

                <input
                  id="total-volumes"
                  type="number"
                  min="1"
                  value={totalVolumes}
                  onChange={(event) =>
                    updateTotalVolumes(
                      event.target.value
                    )
                  }
                  className="w-14 bg-transparent text-center text-sm outline-none"
                />

                <button
                  type="button"
                  aria-label="Aumentar total"
                  onClick={() =>
                    updateTotalVolumes(
                      String(
                        (totalVolsNum ||
                          0) + 1
                      )
                    )
                  }
                  className="p-2 text-muted-foreground transition hover:text-foreground"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {totalVolsNum > 0 ? (
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                {volumeArray.map(
                  (volume) => {
                    const isOwned =
                      ownedVolumes.includes(
                        volume
                      )

                    return (
                      <button
                        key={volume}
                        type="button"
                        onClick={() =>
                          toggleVolume(
                            volume
                          )
                        }
                        aria-pressed={
                          isOwned
                        }
                        className={`aspect-square rounded-lg border text-sm font-medium transition ${
                          isOwned
                            ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'border-border bg-muted text-muted-foreground hover:border-primary/60 hover:text-foreground'
                        }`}
                      >
                        {volume}
                      </button>
                    )
                  }
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Informe o total de volumes
                para começar a organizar
                sua coleção.
              </div>
            )}
          </div>

          {/* Informações */}
          <div
            ref={informationRef}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Informações
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Sobre a obra
            </h2>

            <div className="mt-7 flex flex-col gap-5">
              <label className="flex flex-col gap-2 text-sm text-muted-foreground">
                Título

                <input
                  value={mangaName}
                  onChange={(event) =>
                    setMangaName(
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-border bg-muted px-3 py-2.5 text-foreground outline-none transition focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-muted-foreground">
                Autor

                <input
                  value={author}
                  onChange={(event) =>
                    setAuthor(
                      event.target.value
                    )
                  }
                  placeholder="Ex: Kentaro Miura"
                  className="rounded-lg border border-border bg-muted px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
                />
              </label>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Status de leitura
                </p>

                <div className="flex flex-wrap gap-2">
                  {(
                    Object.keys(
                      STATUS_CONFIG
                    ) as MangaStatus[]
                  ).map(
                    (statusKey) => (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() =>
                          setMangaStatus(
                            statusKey
                          )
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          mangaStatus ===
                          statusKey
                            ? STATUS_CONFIG[
                                statusKey
                              ].className
                            : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {
                          STATUS_CONFIG[
                            statusKey
                          ].label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Avaliação por volume */}
        {ownedVolumes.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Avaliações
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Nota por volume
                </h2>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
                <Star className="size-5 fill-primary text-primary" />

                <div>
                  <p className="font-mono text-xl font-semibold">
                    {averageRating}
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    média
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-8">
              {ownedVolumes.map(
                (volume) => {
                  const rating =
                    pendingRatings[
                      volume
                    ]

                  return (
                    <label
                      key={volume}
                      className="flex flex-col gap-2"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        Vol. {volume}
                      </span>

                      <div
                        className={`rounded-lg border-2 p-2 ${
                          rating !==
                          undefined
                            ? `${getRatingColor(
                                rating
                              )} border-transparent`
                            : 'border-border bg-muted'
                        }`}
                      >
                        <input
                          aria-label={`Nota do volume ${volume}`}
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
                          ) =>
                            updateRating(
                              volume,
                              event.target
                                .value
                            )
                          }
                          className={`w-full bg-transparent text-center text-sm font-bold outline-none placeholder:text-muted-foreground ${
                            rating !==
                            undefined
                              ? 'text-white'
                              : 'text-foreground'
                          }`}
                        />
                      </div>

                      {rating !==
                        undefined && (
                        <span className="text-center text-[10px] text-muted-foreground">
                          {getRatingLabel(
                            rating
                          )}
                        </span>
                      )}
                    </label>
                  )
                }
              )}
            </div>
          </section>
        )}

        {/* Nota geral */}
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Sua avaliação
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Como foi a experiência?
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <input
                aria-label="Nota geral"
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

                  const number =
                    Math.min(
                      10,
                      Math.max(
                        0,
                        Number(value)
                      )
                    )

                  setNote(
                    String(number)
                  )
                }}
                placeholder="—"
                className="w-20 rounded-lg border border-border bg-muted px-3 py-3 text-center font-mono text-lg outline-none focus:border-primary"
              />

              <span className="text-sm text-muted-foreground">
                / 10
              </span>

              {note !== '' && (
                <Star className="size-5 fill-primary text-primary" />
              )}
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Ao adicionar uma nota geral,
            o status da obra será marcado
            automaticamente como{' '}
            <strong className="text-foreground">
              Lido
            </strong>{' '}
            ao salvar.
          </p>
        </section>

        {/* Salvar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <div className="size-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />

              Salvando...
            </>
          ) : (
            <>
              <Save className="size-5" />

              Salvar alterações

              <ChevronRight className="size-5" />
            </>
          )}
        </button>
      </main>

      {/* Modal de exclusão */}
      {showDelete && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <CircleAlert className="size-5" />
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() =>
                  !deleting &&
                  setShowDelete(false)
                }
                disabled={deleting}
                className="text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <h2
              id="delete-title"
              className="mt-5 text-xl font-semibold"
            >
              Remover da coleção?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Esta ação removerá{' '}
              <strong className="text-foreground">
                {mangaName}
              </strong>{' '}
              da sua biblioteca.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowDelete(false)
                }
                disabled={deleting}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/15 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/25 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />

                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />

                    Remover
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