import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Check, Clock3, Library, Star, UserRound } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileHighlightsSelector from '@/components/ProfileHighlightsSelector'
import ProfileAvatarUploader from '@/components/ProfileAvatarUploader'

export const dynamic = 'force-dynamic'

function statusLabel(status: string | null) {
  if (status === 'READ') return 'Lido'
  if (status === 'READING') return 'Lendo'
  if (status === 'WANT_TO_READ') return 'Lista de desejos'
  return 'Sem status'
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { featuredMangaIds: true, avatarUrl: true },
  })

  const mangas = await prisma.manga.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      author: true,
      coverUrl: true,
      status: true,
      isInWishlist: true,
      collectionType: true,
      volume: true,
      totalVolumes: true,
      ownedVolumes: true,
      totalChapters: true,
      readChapters: true,
      note: true,
      updatedAt: true,
    },
  })

  const selectedTopWorks = (profile?.featuredMangaIds ?? [])
    .map((id) => mangas.find((manga) => manga.id === id))
    .filter((manga): manga is (typeof mangas)[number] => Boolean(manga))
  const hasSelectedTopWorks = selectedTopWorks.length > 0
  const topWorks = selectedTopWorks
  const wishlist = mangas.filter((manga) => manga.isInWishlist)
  const totalOwned = mangas.reduce((total, manga) => total + manga.ownedVolumes.length, 0)
  const totalRead = mangas.reduce((total, manga) => total + manga.readChapters.length, 0)
  const reading = mangas.filter((manga) => manga.status === 'READING').length
  const displayName = session.user.name?.trim() || 'Colecionador'

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/mangas" className="group flex items-center gap-3 text-sm text-gray-400 transition hover:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 transition group-hover:border-purple-500/50"><ArrowLeft size={17} /></span>
            <span className="hidden sm:inline">Voltar para coleção</span>
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200"><UserRound size={17} className="text-purple-400" /> Meu perfil</div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/70 via-gray-900/80 to-gray-950 p-6 sm:p-8">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <ProfileAvatarUploader initialAvatarUrl={profile?.avatarUrl ?? null} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Perfil do colecionador</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{displayName}</h1>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[330px]">
              <ProfileStat icon={<Library size={16} />} value={mangas.length} label="Obras" />
              <ProfileStat icon={<BookOpen size={16} />} value={totalOwned} label="Volumes" />
              <ProfileStat icon={<Check size={16} />} value={totalRead} label="Capítulos" />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Destaques</p><h2 className="mt-1 text-2xl font-bold">Top 3 obras</h2></div>
              <span className="text-sm text-gray-500">{reading} em andamento</span>
            </div>
            <ProfileHighlightsSelector options={mangas.map((manga) => ({ id: manga.id, name: manga.name, coverUrl: manga.coverUrl }))} initialSelected={profile?.featuredMangaIds ?? []} />
            {!hasSelectedTopWorks ? <EmptyState text="Escolha até três obras acima para exibir seus destaques." /> : <div className="grid gap-4 sm:grid-cols-3">{topWorks.map((manga, index) => <WorkCard key={manga.id} manga={manga} rank={index + 1} />)}</div>}

            <div className="mb-4 mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Acervo</p><h2 className="mt-1 text-2xl font-bold">Minha coleção</h2></div><Link href="/mangas" className="text-sm font-medium text-purple-400 hover:text-purple-300">Ver detalhes</Link></div>
            {mangas.length === 0 ? <EmptyState text="Sua coleção ainda está vazia." /> : <div className="grid gap-3 sm:grid-cols-2">{mangas.map((manga) => <CollectionRow key={manga.id} manga={manga} />)}</div>}

            <div className="mb-4 mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">Planejamento</p><h2 className="mt-1 text-2xl font-bold">Lista de desejos</h2></div><span className="text-sm text-gray-500">{wishlist.length} {wishlist.length === 1 ? 'obra' : 'obras'}</span></div>
            {wishlist.length === 0 ? <EmptyState text="As obras marcadas como 'Lista de desejos' aparecerão aqui." /> : <div className="grid gap-3 sm:grid-cols-2">{wishlist.map((manga) => <CollectionRow key={`wish-${manga.id}`} manga={manga} showMissingVolumes />)}</div>}
          </section>

          <aside className="h-fit rounded-3xl border border-white/10 bg-gray-900/50 p-5 sm:p-6">
            <div className="flex items-center gap-2"><Clock3 size={18} className="text-purple-400" /><h2 className="font-semibold">Atividades recentes</h2></div>
            <div className="mt-5 space-y-5">{mangas.length === 0 ? <p className="text-sm text-gray-500">As atualizações da sua coleção aparecerão aqui.</p> : mangas.slice(0, 6).map((manga) => <div key={manga.id} className="flex gap-3"><div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"><BookOpen size={14} /></div><div className="min-w-0"><p className="text-sm leading-5 text-gray-300">Atualizou <span className="font-medium text-white">{manga.name}</span></p><p className="mt-1 text-xs text-gray-500">{statusLabel(manga.status)} · {formatDate(manga.updatedAt)}</p></div></div>)}</div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function ProfileStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center"><div className="mx-auto flex w-fit text-purple-400">{icon}</div><p className="mt-1 text-xl font-bold text-white">{value}</p><p className="text-[11px] text-gray-500">{label}</p></div>
}

function WorkCard({ manga, rank }: { manga: { id: string; name: string; author: string | null; coverUrl: string | null; note: number | null; status: string | null; totalVolumes: number | null; ownedVolumes: number[] }; rank: number }) {
  return <Link href={`/mangas/${manga.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 transition hover:-translate-y-1 hover:border-purple-500/40"><div className="relative aspect-[3/4] bg-gray-800">{manga.coverUrl ? <Image src={manga.coverUrl} alt={`Capa de ${manga.name}`} fill sizes="(max-width: 640px) 33vw, 220px" className="object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sm text-gray-500">Sem capa</div>}<span className="absolute left-2 top-2 rounded-lg bg-gray-950/80 px-2 py-1 text-xs font-bold text-purple-300">#{rank}</span></div><div className="p-3"><h3 className="truncate font-semibold text-white">{manga.name}</h3><p className="mt-1 truncate text-xs text-gray-500">{manga.author || 'Autor não informado'}</p><div className="mt-3 flex items-center justify-between text-xs"><span className="text-gray-400">{manga.ownedVolumes.length}{manga.totalVolumes ? `/${manga.totalVolumes}` : ''} vol.</span>{manga.note !== null && <span className="flex items-center gap-1 text-amber-300"><Star size={12} fill="currentColor" />{manga.note.toFixed(1)}</span>}</div></div></Link>
}

function getMissingVolumes(totalVolumes: number | null, ownedVolumes: number[]) {
  if (!totalVolumes || totalVolumes < 1) return null
  const owned = new Set(ownedVolumes.filter((volume) => Number.isInteger(volume) && volume > 0))
  return Array.from({ length: totalVolumes }, (_, index) => index + 1).filter((volume) => !owned.has(volume))
}

function CollectionRow({ manga, showMissingVolumes = false }: { manga: { id: string; name: string; coverUrl: string | null; status: string | null; isInWishlist: boolean; collectionType: string; ownedVolumes: number[]; totalVolumes: number | null; updatedAt: Date }; showMissingVolumes?: boolean }) {
  const progress = manga.totalVolumes ? Math.min(100, Math.round((manga.ownedVolumes.length / manga.totalVolumes) * 100)) : null
  const missingVolumes = showMissingVolumes ? getMissingVolumes(manga.totalVolumes, manga.ownedVolumes) : null
  return <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-3 transition hover:border-purple-500/30 hover:bg-gray-900/70"><Link href={`/mangas/${manga.id}`} className="flex items-center gap-3"><div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-800">{manga.coverUrl ? <Image src={manga.coverUrl} alt="" fill sizes="40px" className="object-cover" /> : null}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-sm font-semibold text-white">{manga.name}</h3><span className="shrink-0 text-[11px] text-purple-300">{manga.collectionType === 'HQ' ? 'HQ' : 'Mangá'}</span></div><p className="mt-1 text-xs text-gray-500">{statusLabel(manga.status)} · {manga.ownedVolumes.length}{manga.totalVolumes ? `/${manga.totalVolumes}` : ''} volumes</p>{progress !== null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-purple-500" style={{ width: `${progress}%` }} /></div>}</div></Link>{showMissingVolumes && <div className="mt-2 border-t border-white/5 pt-2">{missingVolumes === null ? <p className="text-[11px] text-gray-500">Total de volumes não informado</p> : missingVolumes.length === 0 ? <p className="text-[11px] text-emerald-300">Coleção completa</p> : <details><summary className="cursor-pointer list-none text-[11px] font-medium text-amber-300">Faltam {missingVolumes.length} {missingVolumes.length === 1 ? 'volume' : 'volumes'}</summary><p className="mt-1 text-[11px] leading-5 text-gray-400">Volumes: {missingVolumes.join(', ')}</p></details>}</div>}</div>
}

function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/20 p-8 text-center text-sm text-gray-500">{text}</div> }
