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
      volumes: true,
      volumeRatings: {
        select: { volume: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const total = mangas.length

  const volumesLidosTotal = mangas.reduce(
    (acc, manga) => {
      const readVolumes = manga.volumes.filter((volume) => volume.status === 'READ').length
      const ratedVolumes = manga.volumeRatings.length
      return acc + Math.max(readVolumes, ratedVolumes)
    },
    0
  )

  const volumesEmprestadosTotal = mangas.reduce(
    (acc, manga) => acc + manga.volumes.filter((volume) => volume.status === 'LOANED').length,
    0
  )

  const volumesAdquiridosTotal = mangas.reduce(
    (acc, manga) => {
      const persisted = manga.volumes.filter((volume) => volume.status !== 'MISSING').length
      return acc + Math.max(persisted, manga.ownedVolumes.length)
    },
    0
  )

  const volumesFaltantesTotal = mangas.reduce(
    (acc, manga) => {
      if (!manga.totalVolumes) return acc
      return acc + Math.max(0, manga.totalVolumes - Math.max(
        manga.volumes.filter((volume) => volume.status !== 'MISSING').length,
        manga.ownedVolumes.length
      ))
    },
    0
  )

  const lendo = mangas.filter(
    (manga) => manga.status === 'READING'
  ).length

  const querLer = mangas.filter(
    (manga) => manga.status === 'WANT_TO_READ'
  ).length

  const colecaoLida = mangas.filter(
    (manga) =>
      manga.totalVolumes &&
      manga.volume >= manga.totalVolumes
  ).length

  const colecaoEmAndamento = mangas.filter(
    (manga) =>
      !manga.totalVolumes ||
      manga.volume < manga.totalVolumes
  ).length

  const notas = mangas
    .filter((manga) => manga.note !== null)
    .map((manga) => manga.note as number)

  const media =
    notas.length > 0
      ? (
          notas.reduce((a, b) => a + b, 0) /
          notas.length
        ).toFixed(1)
      : '—'

  const totalVolumesUsuario = mangas.reduce(
    (acc, manga) =>
      acc + (manga.ownedVolumes?.length || 0),
    0
  )

  const totalVolumesConhecidos = mangas.reduce(
    (acc, manga) => acc + (manga.totalVolumes ?? 0),
    0
  )

  const progressoColecao =
    totalVolumesConhecidos > 0
      ? Math.min(100, Math.round((volumesLidosTotal / totalVolumesConhecidos) * 100))
      : 0

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
            label="Quero ler"
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