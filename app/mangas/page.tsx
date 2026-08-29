'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Edit2,
  Search,
  ArrowLeft,
  Library,
  Check,
  BookOpen,
  Heart,
  AlertCircle,
  ChevronDown,
  Download,
  SlidersHorizontal,
} from 'lucide-react'

import AddItemModal from '@/components/AddItemModal'
import MangaSkeleton from '@/components/MangaSkeleton'
import QuickEditModal from '@/components/QuickEditModal'
import ExportTextModal from '@/components/ExportTextModal'
import { downloadText } from '@/utils/exportCollection'
import LogoutButton from '@/components/LogoutButton'
import ShareCollectionLink from '@/components/ShareCollectionLink'


type CollectionType = 'MANGA' | 'HQ'

interface Manga {
  id: string
  name: string
  author?: string | null
  volume: number
  totalVolumes?: number | null
  ownedVolumes: number[]
  status: 'READ' | 'READING' | 'WANT_TO_READ'
  note?: number | null
  coverUrl?: string | null
  genre?: string | null
  collectionType: CollectionType
  createdAt: string
}

interface MangaResult {
  mal_id: number
  title: string
  image: string | null
  volumes: number | null
  status: string
  score: number | null
  genre: string | null
  author: string | null
}

export default function MangasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'RECENT' | 'AZ' | 'ZA'>('RECENT')
  const [mangas, setMangas] = useState<Manga[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'READ' | 'READING' | 'WANT_TO_READ' | 'MISSING'
  >('ALL')
  const [authorFilter, setAuthorFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [collectionTypeFilter, setCollectionTypeFilter] = useState<'ALL' | 'MANGA' | 'HQ'>('ALL')
  const [progressFilter, setProgressFilter] = useState<'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'>('ALL')
  const [volumesFilter, setVolumesFilter] = useState<'ALL' | 'MISSING' | 'COMPLETE'>('ALL')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingManga, setEditingManga] = useState<Manga | null>(null)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportContent, setExportContent] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMangas()
    }
  }, [status, page, search, filterStatus, authorFilter, genreFilter, collectionTypeFilter, progressFilter, volumesFilter, sortOrder])

  const fetchMangas = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        q: search,
        status: filterStatus,
        author: authorFilter,
        genre: genreFilter,
        collectionType: collectionTypeFilter,
        progress: progressFilter,
        volumes: volumesFilter,
        sort: sortOrder,
      })
      const response = await fetch(`/api/mangas?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`)
      }

      const data = await response.json()

      setMangas(data.items ?? [])
      setTotalItems(data.pagination?.totalItems ?? 0)
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro desconhecido'
      )

      console.error('Erro ao buscar mangas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(
    manga: MangaResult,
    collectionType: CollectionType
  ) {
    const res = await fetch('/api/mangas', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        name: manga.title,
        author: manga.author,
        coverUrl: manga.image,
        totalVolumes: manga.volumes,
        volume: 1,
        status: 'WANT_TO_READ',
        genre: manga.genre,
        collectionType,
      }),
    })

    if (res.status === 409) return

    if (!res.ok) {
      throw new Error('Erro ao adicionar')
    }

    fetchMangas()
  }

  async function handleAddManual(form: any) {
    const res = await fetch('/api/mangas', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        name: form.title,
        author: form.author || null,
        coverUrl: form.image || null,
        totalVolumes: form.volumes
          ? parseInt(form.volumes)
          : null,
        volume: 1,
        status: 'WANT_TO_READ',
        genre: form.genre || null,
        collectionType: form.type,
      }),
    })

    if (res.status === 409) return

    if (!res.ok) {
      throw new Error('Erro ao adicionar')
    }

    fetchMangas()
  }

  async function handleQuickUpdate(
    updatedData: Partial<Manga>
  ) {
    if (!editingManga) return

    const res = await fetch(
      `/api/mangas/${editingManga.id}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          ...editingManga,
          ...updatedData,
        }),
      }
    )

    if (!res.ok) {
      throw new Error('Erro ao atualizar')
    }

    fetchMangas()
  }

  async function handleExportClick() {
    try {
      const response = await fetch('/api/mangas/export?format=txt')
      if (!response.ok) throw new Error('Não foi possível preparar a exportação')
      setExportContent(await response.text())
      setShowExportModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao preparar exportação')
    }
  }

  async function handleDownload(format: 'txt' | 'csv' | 'json') {
    if (format === 'txt') {
      downloadText(exportContent, 'pinakes-colecao.txt')
      return
    }

    const response = await fetch(`/api/mangas/export?format=${format}`)
    if (!response.ok) throw new Error('Não foi possível baixar a exportação')

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pinakes-colecao.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const filteredMangas = mangas

  const getStatusBadge = (status: string) => {
    const map: Record<
      string,
      {
        label: string
        color: string
      }
    > = {
      READ: {
        label: 'Lido',
        color:
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },

      READING: {
        label: 'Lendo',
        color:
          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      },

      WANT_TO_READ: {
        label: 'Quero ler',
        color:
          'bg-blue-500/10 text-blue-400 border-blue-500/20',
      },
    }

    return (
      map[status] ?? {
        label: status,
        color:
          'bg-gray-500/10 text-gray-400 border-gray-500/20',
      }
    )
  }

  const filters = [
    {
      key: 'ALL',
      label: 'Todos',
      icon: Library,
      count: mangas.length,
    },

    {
      key: 'READ',
      label: 'Lidos',
      icon: Check,
      count: mangas.filter(
        (m) => m.status === 'READ'
      ).length,
    },

    {
      key: 'READING',
      label: 'Lendo',
      icon: BookOpen,
      count: mangas.filter(
        (m) => m.status === 'READING'
      ).length,
    },

    {
      key: 'WANT_TO_READ',
      label: 'Quero ler',
      icon: Heart,
      count: mangas.filter(
        (m) => m.status === 'WANT_TO_READ'
      ).length,
    },

    {
      key: 'MISSING',
      label: 'Faltando',
      icon: AlertCircle,
      count: mangas.filter(
        (m) =>
          (m.totalVolumes || 0) > 0 &&
          (m.ownedVolumes?.length || 0) <
            (m.totalVolumes || 0)
      ).length,
    },
  ]

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-800 border-t-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-350px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      {/* Header */}

      <header className="relative z-20 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">

            <Link
              href="/"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 transition hover:border-purple-500/50 hover:bg-purple-500/10"
            >
              <ArrowLeft
                size={18}
                className="text-gray-400 transition group-hover:-translate-x-0.5 group-hover:text-purple-400"
              />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow-lg shadow-purple-900/20">
                <Image src="/brand/logo.png" alt="Pinakes" fill sizes="36px" className="object-cover" priority />
              </div>
              <h1 className="text-base font-bold sm:text-lg">
                Minha coleção
              </h1>

              <p className="text-xs text-gray-500">
                {totalItems}{' '}
                {totalItems === 1
                  ? 'item'
                  : 'itens'}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <span className="hidden max-w-[180px] truncate text-sm text-gray-500 md:block">
              {session?.user?.name ||
                session?.user?.email}
            </span>

            <button
              onClick={handleExportClick}
              disabled={totalItems === 0}
              className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-700 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
              title="Visualizar exportação em texto"
            >
              <Download size={18} />

              <span className="hidden sm:inline">
                Exportar
              </span>
            </button>

            <ShareCollectionLink />

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-semibold shadow-lg shadow-purple-900/20 transition hover:bg-purple-700 hover:shadow-purple-700/20 sm:px-4"
            >
              <Plus size={18} />

              <span className="hidden sm:inline">
                Adicionar
              </span>
            </button>

            <LogoutButton />

          </div>

        </div>

      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Top */}

        <div className="mb-10">

          <div className="mb-7">

            <p className="mb-2 text-sm font-medium text-purple-400">
              PINAKES
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sua coleção.
            </h2>

          </div>

          {/* Search */}

          <div className="relative max-w-2xl">

            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Pesquisar mangá ou autor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-2xl border border-gray-800 bg-gray-900/70 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/60 focus:bg-gray-900 focus:ring-4 focus:ring-purple-500/5"
            />

          </div>

        </div>

        {/* Filters */}

        <div className="mb-10 flex flex-col gap-4 border-b border-gray-900 pb-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">

            {filters.map(
              ({
                key,
                label,
                count,
                icon: Icon,
              }) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilterStatus(key as any)
                    setPage(1)
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    filterStatus === key
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                      : 'border border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:bg-gray-900 hover:text-gray-200'
                  }`}
                >

                  <Icon size={15} />

                  <span>
                    {label}
                  </span>

                  <span
                    className={`text-xs ${
                      filterStatus === key
                        ? 'text-purple-200'
                        : 'text-gray-600'
                    }`}
                  >
                    {count}
                  </span>

                </button>
              )
            )}

          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
            aria-expanded={showAdvancedFilters}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${showAdvancedFilters || authorFilter || genreFilter || collectionTypeFilter !== 'ALL' || progressFilter !== 'ALL' || volumesFilter !== 'ALL' ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:text-gray-200'}`}
          >
            <SlidersHorizontal size={15} />
            Filtros avançados
          </button>

          {/* Sort */}

          <div className="relative shrink-0">

            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(
                  e.target.value as
                    | 'RECENT'
                    | 'AZ'
                    | 'ZA'
                )
                setPage(1)
              }}
              className="appearance-none rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 pr-10 text-sm text-gray-300 outline-none transition hover:border-gray-700 focus:border-purple-500"
            >
              <option value="RECENT">
                Recentes
              </option>

              <option value="AZ">
                A — Z
              </option>

              <option value="ZA">
                Z — A
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            </div>
          </div>

        </div>

        {showAdvancedFilters && (
          <section className="mb-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5" aria-label="Filtros avançados">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-gray-500">Autor</span>
                <input value={authorFilter} onChange={(event) => { setAuthorFilter(event.target.value); setPage(1) }} placeholder="Filtrar por autor" className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-gray-500">Gênero</span>
                <input value={genreFilter} onChange={(event) => { setGenreFilter(event.target.value); setPage(1) }} placeholder="Ex.: ação, romance" className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-gray-500">Tipo de coleção</span>
                <select value={collectionTypeFilter} onChange={(event) => { setCollectionTypeFilter(event.target.value as typeof collectionTypeFilter); setPage(1) }} className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500">
                  <option value="ALL">Todos os tipos</option><option value="MANGA">Mangás</option><option value="HQ">HQs</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-gray-500">Progresso</span>
                <select value={progressFilter} onChange={(event) => { setProgressFilter(event.target.value as typeof progressFilter); setPage(1) }} className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500">
                  <option value="ALL">Todos</option><option value="NOT_STARTED">Não iniciados</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETE">Concluídos</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-gray-500">Volumes</span>
                <select value={volumesFilter} onChange={(event) => { setVolumesFilter(event.target.value as typeof volumesFilter); setPage(1) }} className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500">
                  <option value="ALL">Todos</option><option value="MISSING">Com volumes faltantes</option><option value="COMPLETE">Coleção completa</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => { setAuthorFilter(''); setGenreFilter(''); setCollectionTypeFilter('ALL'); setProgressFilter('ALL'); setVolumesFilter('ALL'); setFilterStatus('ALL'); setPage(1) }} className="text-sm font-medium text-gray-400 transition hover:text-white">Limpar filtros</button>
            </div>
          </section>
        )}

        {/* Error */}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="font-medium text-red-300">
                  Não foi possível carregar a coleção
                </p>

                <p className="mt-1 text-sm text-red-300/60">
                  {error}
                </p>
              </div>

              <button
                onClick={fetchMangas}
                className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
              >
                Tentar novamente
              </button>

            </div>

          </div>
        )}

        {/* Loading */}

        {loading ? (

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {[...Array(10)].map((_, i) => (
              <MangaSkeleton key={i} />
            ))}

          </div>

        ) : filteredMangas.length === 0 ? (

          /* Empty state */

          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-800 bg-gray-900/20 px-6 text-center">

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
              <Library
                size={28}
                className="text-purple-400"
              />
            </div>

            <h3 className="text-xl font-semibold">

              {mangas.length === 0
                ? 'Sua coleção está vazia'
                : 'Nada encontrado'}

            </h3>

            <p className="mt-2 text-sm text-gray-500">

              {mangas.length === 0
                ? 'Adicione seu primeiro mangá.'
                : 'Tente mudar sua busca ou filtro.'}

            </p>

            {mangas.length === 0 && (

              <button
                onClick={() => setShowModal(true)}
                className="mt-6 flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700"
              >
                <Plus size={17} />
                Adicionar mangá
              </button>

            )}

          </div>

        ) : (

          /* Manga grid */

          <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">

            {filteredMangas.map((manga) => {

              const badge =
                getStatusBadge(manga.status)

              const owned =
                manga.ownedVolumes?.length || 0

              const total =
                manga.totalVolumes || 0

              const progress =
                total > 0
                  ? Math.min(
                      (owned / total) * 100,
                      100
                    )
                  : 0

              return (

                <div
                  key={manga.id}
                  className="group relative"
                >

                  {/* Edit */}

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingManga(manga)
                    }}
                    className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white opacity-0 backdrop-blur-md transition hover:bg-purple-600 group-hover:opacity-100"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>

                  <Link
                    href={`/mangas/${manga.id}`}
                    className="block"
                  >

                    <article className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 transition duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-950/20">

                      {/* Cover */}

                      <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">

                        {manga.coverUrl ? (

                          <img
                            src={manga.coverUrl}
                            alt={manga.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-900/50 via-gray-900 to-gray-950">

                            <Library
                              size={32}
                              className="text-purple-400/60"
                            />

                          </div>

                        )}

                        {/* Gradient */}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

                        {/* Status */}

                        <div className="absolute bottom-3 left-3">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md ${badge.color}`}
                          >
                            {badge.label}
                          </span>

                        </div>

                      </div>

                      {/* Info */}

                      <div className="p-3.5 sm:p-4">

                        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-white transition group-hover:text-purple-300 sm:text-base">
                          {manga.name}
                        </h3>

                        <p className="mt-1 h-4 truncate text-xs text-gray-500">
                          {manga.author || 'Autor desconhecido'}
                        </p>

                        {/* Volumes */}

                        {total > 0 && (

                          <div className="mt-4">

                            <div className="mb-1.5 flex items-center justify-between text-[11px]">

                              <span className="text-gray-500">
                                Volumes
                              </span>

                              <span className="font-medium text-gray-300">
                                {owned}/{total}
                              </span>

                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">

                              <div
                                className="h-full rounded-full bg-purple-500 transition-all"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />

                            </div>

                          </div>

                        )}

                        {/* Footer */}

                        <div className="mt-4 flex items-center justify-between">

                          <span className="text-xs text-gray-500">
                            Vol. {manga.volume}
                          </span>

                          {manga.note && (

                            <span className="text-xs font-semibold text-yellow-400">
                              ★ {manga.note}
                            </span>

                          )}

                        </div>

                      </div>

                    </article>

                  </Link>

                </div>
              )
            })}

          </div>

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Paginação da coleção">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:border-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página <strong className="text-gray-200">{page}</strong> de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:border-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
              </button>
            </nav>
          )}
          </>

        )}

      </main>

      {/* Add Modal */}

      {showModal && (

        <AddItemModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          onAddManual={handleAddManual}
        />

      )}

      {/* Quick Edit */}

      {editingManga && (

        <QuickEditModal
          manga={editingManga}
          onClose={() =>
            setEditingManga(null)
          }
          onSave={handleQuickUpdate}
        />

      )}

      {/* Export */}

      {showExportModal && (

        <ExportTextModal
          content={exportContent}
          onClose={() => setShowExportModal(false)}
          onDownload={handleDownload}
        />

      )}

    </div>
  )
}