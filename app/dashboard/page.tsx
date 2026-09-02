import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import {
  Library,
  BookOpen,
  Check,
  Heart,
  Layers,
  AlertCircle,
  HandCoins,
  TrendingUp,
  Star,
  ArrowRight,
  Plus,
} from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const mangas = await prisma.manga.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      volumes: {
        include: {
          history: {
            select: { toStatus: true, changedAt: true },
          },
        },
      },
      volumeRatings: {
        select: { volume: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const wishlistMangas = mangas.filter(
    (manga) => manga.isInWishlist || manga.status === 'WANT_TO_READ'
  )
  const collectionMangas = mangas.filter(
    (manga) => !manga.isInWishlist && manga.status !== 'WANT_TO_READ'
  )

  const total = collectionMangas.length
  const wishlistTotal = wishlistMangas.length

  const volumesLidosTotal = collectionMangas.reduce(
    (acc, manga) => {
      const readVolumes = manga.volumes.filter((volume) => volume.status === 'READ').length
      const ratedVolumes = manga.volumeRatings.length
      return acc + Math.max(readVolumes, ratedVolumes)
    },
    0
  )

  const volumesEmprestadosTotal = collectionMangas.reduce(
    (acc, manga) => acc + manga.volumes.filter((volume) => volume.status === 'LOANED').length,
    0
  )

  const volumesAdquiridosTotal = collectionMangas.reduce(
    (acc, manga) => {
      const persisted = manga.volumes.filter((volume) => volume.status !== 'MISSING').length
      return acc + Math.max(persisted, manga.ownedVolumes.length)
    },
    0
  )

  const volumesFaltantesTotal = collectionMangas.reduce(
    (acc, manga) => {
      if (!manga.totalVolumes) return acc
      return acc + Math.max(0, manga.totalVolumes - Math.max(
        manga.volumes.filter((volume) => volume.status !== 'MISSING').length,
        manga.ownedVolumes.length
      ))
    },
    0
  )

  const lendo = collectionMangas.filter(
    (manga) => manga.status === 'READING'
  ).length

  const querLer = wishlistTotal

  const colecaoLida = collectionMangas.filter(
    (manga) =>
      manga.totalVolumes &&
      manga.volume >= manga.totalVolumes
  ).length

  const colecaoEmAndamento = collectionMangas.filter(
    (manga) =>
      !manga.totalVolumes ||
      manga.volume < manga.totalVolumes
  ).length

  const notas = collectionMangas
    .filter((manga) => manga.note !== null)
    .map((manga) => manga.note as number)

  const media =
    notas.length > 0
      ? (
          notas.reduce((a, b) => a + b, 0) /
          notas.length
        ).toFixed(1)
      : '—'

  const totalVolumesUsuario = collectionMangas.reduce(
    (acc, manga) =>
      acc + (manga.ownedVolumes?.length || 0),
    0
  )

  const totalVolumesConhecidos = collectionMangas.reduce(
    (acc, manga) => acc + (manga.totalVolumes ?? 0),
    0
  )

  const progressoColecao =
    totalVolumesConhecidos > 0
      ? Math.min(100, Math.round((volumesLidosTotal / totalVolumesConhecidos) * 100))
      : 0

  const currentDate = new Date()
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
      count: 0,
    }
  })
  const monthIndex = new Map(monthBuckets.map((month, index) => [month.key, index]))
  const readingEvents = collectionMangas.flatMap((manga) =>
    manga.volumes.flatMap((volume) =>
      volume.history
        .filter((event) => event.toStatus === 'READ')
        .map((event) => event.changedAt)
    )
  )
  readingEvents.forEach((changedAt) => {
    const date = new Date(changedAt)
    const index = monthIndex.get(`${date.getFullYear()}-${date.getMonth()}`)
    if (index !== undefined) monthBuckets[index].count += 1
  })
  const maxMonthlyReading = Math.max(...monthBuckets.map((month) => month.count), 1)
  const readingThisMonth = monthBuckets[monthBuckets.length - 1]?.count ?? 0
  const readingLastMonth = monthBuckets[monthBuckets.length - 2]?.count ?? 0
  const genreCounts = collectionMangas.reduce<Record<string, number>>((counts, manga) => {
    const genre = manga.genre?.trim()
    if (genre) counts[genre] = (counts[genre] ?? 0) + 1
    return counts
  }, {})
  const favoriteGenres = Object.entries(genreCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5)
  const maxGenreCount = Math.max(...favoriteGenres.map(([, count]) => count), 1)
  const timelinePoints = monthBuckets.map((month, index) => ({
    ...month,
    x: 24 + index * 102,
    y: 178 - (month.count / maxMonthlyReading) * 138,
  }))
  const timelinePolyline = timelinePoints.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-350px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-purple-900/30">
              <Image src="/brand/logo.png" alt="Pinakes" fill sizes="40px" className="object-cover" priority />
            </div>

            <div>
              <h1 className="text-base font-bold">
                Pinakes Manga
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">

            <span className="hidden max-w-[180px] truncate text-sm text-gray-500 md:block">
              {session.user.name ||
                session.user.email}
            </span>

            <Link
              href="/mangas"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-purple-900/20 transition hover:bg-purple-700"
            >
              <Library size={17} />

              <span className="hidden sm:inline">
                Minha coleção
              </span>
            </Link>

            <Link
              href="/mangas?view=wishlist"
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 transition hover:border-blue-400/50 hover:bg-blue-500/20"
            >
              <Heart size={17} />

              <span className="hidden sm:inline">
                Wishlist
              </span>
            </Link>

            <LogoutButton />

          </div>

        </div>

      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Hero */}
        <section className="mb-10">

          <p className="mb-2 text-sm font-medium text-purple-400">
            VISÃO GERAL
          </p>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Olá,{' '}
            {session.user.name?.split(' ')[0] || 'colecionador'}.
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Sua coleção em números.
          </p>

        </section>

        {/* Stats principais */}
        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <StatCard
            label="Obras"
            value={total}
            icon={<Library size={20} />}
            iconClass="bg-purple-500/10 text-purple-400"
          />

          <StatCard
            label="Volumes lidos"
            value={volumesLidosTotal}
            icon={<Check size={20} />}
            iconClass="bg-emerald-500/10 text-emerald-400"
          />

          <StatCard
            label="Lendo"
            value={lendo}
            icon={<BookOpen size={20} />}
            iconClass="bg-yellow-500/10 text-yellow-400"
          />

          <StatCard
            label="Wishlist"
            value={querLer}
            icon={<Heart size={20} />}
            iconClass="bg-blue-500/10 text-blue-400"
          />

          <StatCard
            label="Faltantes"
            value={volumesFaltantesTotal}
            icon={<AlertCircle size={20} />}
            iconClass="bg-rose-500/10 text-rose-400"
          />

        </section>

        {/* Destaque */}
        <section className="mb-6 grid gap-4 lg:grid-cols-3">

          {/* Progresso */}
          <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6 lg:col-span-2">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Progresso da coleção
                </p>

                <div className="mt-3 flex items-baseline gap-2">

                  <span className="text-4xl font-bold">
                    {progressoColecao}%
                  </span>

                  <span className="text-sm text-gray-500">
                    concluída
                  </span>

                </div>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                <TrendingUp size={21} />
              </div>

            </div>

            <div className="mt-8 h-2 overflow-hidden rounded-full bg-gray-800">

              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-400 transition-all"
                style={{
                  width: `${progressoColecao}%`,
                }}
              />

            </div>

            <div className="mt-3 flex justify-between text-xs text-gray-500">

              <span>
                {volumesLidosTotal}/{totalVolumesConhecidos || '?'} volumes lidos
              </span>

              <span>
                {colecaoEmAndamento} obras em andamento
              </span>

            </div>

          </div>

          {/* Nota */}
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 via-gray-900 to-gray-950 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-400">
              <Star size={21} />
            </div>

            <p className="mt-6 text-sm text-gray-400">
              Média de notas
            </p>

            <p className="mt-1 text-5xl font-bold text-purple-400">
              {media}
            </p>

            <p className="mt-3 text-xs text-gray-500">
              {notas.length}{' '}
              {notas.length === 1
                ? 'obra avaliada'
                : 'obras avaliadas'}
            </p>

          </div>

        </section>

        {/* Estatísticas detalhadas */}
        <section className="mb-10 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Leitura ao longo do tempo</p>
                <h3 className="mt-1 text-xl font-bold text-white">Últimos seis meses</h3>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">{readingEvents.length} registros</span>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-gray-950/60 p-3 sm:p-4">
              <svg viewBox="0 0 560 220" className="h-auto w-full text-purple-400" role="img" aria-label="Gráfico de volumes lidos por mês">
                {[0, 1, 2, 3].map((line) => {
                  const y = 178 - line * 46
                  return <line key={line} x1="24" x2="534" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="4 6" />
                })}
                <polyline points={timelinePolyline} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {timelinePoints.map((point) => (
                  <g key={point.key}>
                    <circle cx={point.x} cy={point.y} r="6" fill="#111827" stroke="currentColor" strokeWidth="3" />
                    <text x={point.x} y="207" textAnchor="middle" className="fill-gray-500 text-[11px]">{point.label}</text>
                  </g>
                ))}
              </svg>
            </div>
            <p className="mt-3 text-xs text-gray-500">{readingEvents.length > 0 ? 'Cada ponto representa volumes registrados como lidos no mês.' : 'Marque volumes como lidos para começar a formar seu histórico.'}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Gêneros favoritos</p>
                  <h3 className="mt-1 text-xl font-bold text-white">Mais presentes na coleção</h3>
                </div>
                <Star size={20} className="text-purple-400" />
              </div>
              {favoriteGenres.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {favoriteGenres.map(([genre, count]) => (
                    <div key={genre}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium text-gray-300">{genre}</span>
                        <span className="shrink-0 text-gray-500">{count} {count === 1 ? 'obra' : 'obras'}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-400" style={{ width: `${Math.max(12, (count / maxGenreCount) * 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-5 rounded-2xl border border-dashed border-gray-800 px-4 py-6 text-center text-sm text-gray-500">Adicione gêneros às obras para ver seus favoritos.</p>}
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/25 via-gray-900 to-gray-950 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-400">Ritmo de leitura</p>
                  <p className="mt-2 text-4xl font-bold text-purple-300">{readingThisMonth}</p>
                  <p className="mt-1 text-xs text-gray-500">{readingThisMonth === 1 ? 'volume lido neste mês' : 'volumes lidos neste mês'}</p>
                </div>
                <TrendingUp size={20} className="text-purple-300" />
              </div>
              <div className="mt-5 flex h-20 items-end gap-2" aria-label="Ritmo de leitura por mês">
                {monthBuckets.map((month) => <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5"><div className="flex h-14 w-full items-end"><div className="w-full rounded-t-md bg-purple-500/70 transition-all" style={{ height: `${month.count === 0 ? 4 : Math.max(12, (month.count / maxMonthlyReading) * 100)}%` }} title={`${month.count} ${month.count === 1 ? 'volume' : 'volumes'} em ${month.label}`} /></div><span className="text-[10px] text-gray-600">{month.label}</span></div>)}
              </div>
              <p className="mt-4 text-xs text-gray-500">{readingThisMonth > readingLastMonth ? 'Você acelerou em relação ao mês passado.' : readingThisMonth < readingLastMonth ? 'O ritmo caiu em relação ao mês passado.' : 'O ritmo está igual ao do mês passado.'}</p>
            </div>
          </div>
        </section>

        {/* Stats secundárias */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">

          <SmallStat
            icon={<Layers size={18} />}
            label="Volumes adquiridos"
            value={Math.max(totalVolumesUsuario, volumesAdquiridosTotal)}
            color="text-purple-400"
          />

          <SmallStat
            icon={<BookOpen size={18} />}
            label="Em andamento"
            value={colecaoEmAndamento}
            color="text-yellow-400"
          />

          <SmallStat
            icon={<Check size={18} />}
            label="Coleções concluídas"
            value={colecaoLida}
            color="text-emerald-400"
          />

          <SmallStat
            icon={<HandCoins size={18} />}
            label="Volumes emprestados"
            value={volumesEmprestadosTotal}
            color="text-amber-400"
          />

        </section>

        {/* Empty state */}
        {total === 0 && (

          <section className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-800 bg-gray-900/20 px-6 text-center">

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <Library size={28} />
            </div>

            <h3 className="text-xl font-semibold">
              Sua coleção está vazia
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Comece adicionando sua primeira obra.
            </p>

            <Link
              href="/mangas"
              className="mt-6 flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700"
            >
              <Plus size={17} />

              Adicionar mangá

              <ArrowRight size={16} />

            </Link>

          </section>

        )}

        {/* Ação para coleção existente */}
        {total > 0 && (

          <div className="flex justify-center pt-4">

            <Link
              href="/mangas"
              className="group flex items-center gap-2 text-sm font-medium text-purple-400 transition hover:text-purple-300"
            >
              Ver minha coleção

              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />

            </Link>

          </div>

        )}

      </main>

    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  iconClass: string
}) {
  return (
    <div className="group rounded-2xl border border-gray-800 bg-gray-900/50 p-4 transition hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-900 sm:p-5">

      <div className="flex items-start justify-between">

        <p className="text-xs text-gray-500 sm:text-sm">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight">
        {value}
      </p>

    </div>
  )
}

function SmallStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/40 p-5">

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-800 ${color}`}
      >
        {icon}
      </div>

      <div>

        <p className="text-xs text-gray-500">
          {label}
        </p>

        <p className={`mt-1 text-xl font-bold ${color}`}>
          {value}
        </p>

      </div>

    </div>
  )
}