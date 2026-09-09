import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Activity, ArrowLeft, Bookmark, BookOpen, Check, Clock3, Heart, Library, List, MessageCircle, Pencil, Star, UserRound } from 'lucide-react'
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

function getMissingVolumes(totalVolumes: number | null, ownedVolumes: number[]) {
  if (!totalVolumes || totalVolumes < 1) return null
  const owned = new Set(ownedVolumes.filter((volume) => Number.isInteger(volume) && volume > 0))
  return Array.from({ length: totalVolumes }, (_, index) => index + 1).filter((volume) => !owned.has(volume))
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
      isFavorite: true,
      collectionType: true,
      totalVolumes: true,
      ownedVolumes: true,
      readChapters: true,
      note: true,
      updatedAt: true,
    },
  })

  const selectedTopWorks = (profile?.featuredMangaIds ?? [])
    .map((id) => mangas.find((manga) => manga.id === id))
    .filter((manga): manga is (typeof mangas)[number] => Boolean(manga))
  const wishlist = mangas.filter((manga) => manga.isInWishlist)
  const favorites = mangas.filter((manga) => manga.isFavorite)
  const totalOwned = mangas.reduce((total, manga) => total + manga.ownedVolumes.length, 0)
  const totalRead = mangas.reduce((total, manga) => total + manga.readChapters.length, 0)
  const reading = mangas.filter((manga) => manga.status === 'READING').length
  const readWorks = mangas.filter((manga) => manga.status === 'READ').length
  const rated = mangas.filter((manga) => manga.note !== null)
  const averageNote = rated.length ? rated.reduce((total, manga) => total + (manga.note ?? 0), 0) / rated.length : 0
  const ratingBars = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: rated.filter((manga) => Math.round(manga.note ?? 0) === rating).length }))
  const maxRatingCount = Math.max(...ratingBars.map((item) => item.count), 1)
  const displayName = session.user.name?.trim() || 'Colecionador'
  const email = session.user.email || 'Perfil do colecionador'

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-320px] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute right-[-160px] top-[38%] h-[420px] w-[420px] rounded-full bg-purple-500/[0.04] blur-[140px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.07] bg-gray-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/mangas" className="group flex items-center gap-3 text-sm text-gray-400 transition hover:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition group-hover:border-purple-400/50"><ArrowLeft size={17} /></span>
            <span className="hidden sm:inline">Voltar para coleção</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400"><UserRound size={15} className="text-purple-400" /> Perfil</div>
        </div>
      </header>

      <section className="relative z-10 border-b border-white/[0.06] bg-gray-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-10">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <ProfileAvatarUploader initialAvatarUrl={profile?.avatarUrl ?? null} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
                <span className="rounded-full border border-purple-400/25 bg-purple-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">Colecionador</span>
              </div>
              <p className="mt-1 truncate text-sm text-gray-400">{email}</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-gray-500"><Activity size={13} className="text-purple-400" /> Construindo uma coleção de histórias</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[370px] sm:gap-3">
            <ProfileStat icon={<Library size={16} />} value={mangas.length} label="Obras" />
            <ProfileStat icon={<BookOpen size={16} />} value={totalOwned} label="Volumes" />
            <ProfileStat icon={<Check size={16} />} value={totalRead} label="Capítulos" />
          </div>
        </div>
      </section>

      <nav className="relative z-10 border-b border-white/[0.07] bg-gray-950">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 scrollbar-none sm:px-6">
          {[
            ['Perfil', '#perfil', true],
            ['Atividade', '#atividade', false],
            ['Coleção', '#colecao', false],
            ['Favoritos', '#favoritos', false],
            ['Lista de desejos', '#desejos', false],
            ['Estatísticas', '#estatisticas', false],
          ].map(([label, href, active]) => <a key={label as string} href={href as string} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold transition ${active ? 'border-purple-400 text-white' : 'border-transparent text-gray-500 hover:border-white/20 hover:text-gray-200'}`}>{label as string}</a>)}
        </div>
      </nav>

      <div id="perfil" className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0">
            <section className="border-b border-white/[0.08] pb-8">
              <SectionHeading eyebrow="Seleção pessoal" title="Obras em destaque" action={<span className="text-xs text-gray-500">Até 3 obras</span>} />
              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-gray-900/60 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2 text-xs text-gray-400"><Pencil size={13} className="text-purple-400" /> Escolha as obras que representam sua coleção</div>
                <ProfileHighlightsSelector options={mangas.map((manga) => ({ id: manga.id, name: manga.name, coverUrl: manga.coverUrl }))} initialSelected={profile?.featuredMangaIds ?? []} />
              </div>
              {selectedTopWorks.length === 0 ? <EmptyState text="Escolha até três obras acima para exibir seus destaques." /> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">{selectedTopWorks.map((manga, index) => <WorkCard key={manga.id} manga={manga} rank={index + 1} />)}</div>}
            </section>

            <section id="atividade" className="scroll-mt-20 border-b border-white/[0.08] py-8">
              <SectionHeading eyebrow="Seu histórico" title="Atividade recente" action={<span className="text-xs text-gray-500">{mangas.length} atualizações</span>} />
              {mangas.length === 0 ? <EmptyState text="As atualizações da sua coleção aparecerão aqui." /> : <div className="mt-5 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.08] bg-gray-900/40">{mangas.slice(0, 6).map((manga) => <ActivityRow key={manga.id} manga={manga} />)}</div>}
            </section>

            <section id="colecao" className="scroll-mt-20 border-b border-white/[0.08] py-8">
              <SectionHeading eyebrow="Acervo pessoal" title="Minha coleção" action={<Link href="/mangas" className="text-xs font-semibold text-purple-400 transition hover:text-purple-300">Ver coleção completa</Link>} />
              {mangas.length === 0 ? <EmptyState text="Sua coleção ainda está vazia." /> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{mangas.map((manga) => <CollectionRow key={manga.id} manga={manga} />)}</div>}
            </section>

            <section id="favoritos" className="scroll-mt-20 border-b border-white/[0.08] py-8">
              <SectionHeading eyebrow="Sua curadoria" title="Favoritos" action={<span className="text-xs text-gray-500">{favorites.length} {favorites.length === 1 ? 'obra' : 'obras'}</span>} />
              {favorites.length === 0 ? <EmptyState text="As obras marcadas com o coração aparecerão aqui." /> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{favorites.map((manga) => <CollectionRow key={`favorite-${manga.id}`} manga={manga} />)}</div>}
            </section>

            <section id="desejos" className="scroll-mt-20 py-8">
              <SectionHeading eyebrow="Planejamento" title="Lista de desejos" action={<span className="text-xs text-gray-500">{wishlist.length} {wishlist.length === 1 ? 'obra' : 'obras'}</span>} />
              {wishlist.length === 0 ? <EmptyState text="As obras marcadas como Lista de desejos aparecerão aqui." /> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{wishlist.map((manga) => <CollectionRow key={`wish-${manga.id}`} manga={manga} showMissingVolumes />)}</div>}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <section id="estatisticas" className="scroll-mt-20 rounded-2xl border border-white/[0.08] bg-gray-900/60 p-5">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Star size={16} className="text-purple-400" /><h2 className="font-semibold">Suas avaliações</h2></div><span className="text-xs text-gray-500">{rated.length}</span></div>
              <div className="mt-5 flex items-end justify-between gap-4"><div><p className="text-3xl font-bold text-white">{averageNote ? averageNote.toFixed(1) : '—'}</p><p className="mt-1 text-xs text-gray-500">média das notas</p></div><div className="flex items-center gap-1 text-purple-300">{[1, 2, 3, 4, 5].map((item) => <Star key={item} size={14} fill={item <= Math.round(averageNote) ? 'currentColor' : 'none'} />)}</div></div>
              <div className="mt-6 space-y-2">{ratingBars.map((item) => <div key={item.rating} className="flex items-center gap-2 text-[11px] text-gray-500"><span className="w-3">{item.rating}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-purple-500" style={{ width: `${(item.count / maxRatingCount) * 100}%` }} /></div><span className="w-4 text-right">{item.count}</span></div>)}</div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-gray-900/60 p-5">
              <div className="flex items-center gap-2"><Clock3 size={16} className="text-purple-400" /><h2 className="font-semibold">Resumo</h2></div>
              <div className="mt-4 space-y-3"><SummaryRow icon={<BookOpen size={14} />} label="Lendo agora" value={reading} /><SummaryRow icon={<Check size={14} />} label="Obras concluídas" value={readWorks} /><SummaryRow icon={<Heart size={14} />} label="Favoritos" value={favorites.length} /><SummaryRow icon={<Bookmark size={14} />} label="Na lista de desejos" value={wishlist.length} /></div>
            </section>

            <section className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-5"><div className="flex items-center gap-2 text-purple-300"><MessageCircle size={16} /><h2 className="font-semibold">Continue explorando</h2></div><p className="mt-3 text-sm leading-6 text-gray-400">Encontre novas obras para acompanhar e deixe sua coleção cada vez mais com a sua cara.</p><Link href="/mangas" className="mt-4 inline-flex text-xs font-bold uppercase tracking-wider text-purple-300 transition hover:text-white">Explorar catálogo →</Link></section>
          </aside>
        </div>
      </div>
    </main>
  )
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h2></div>{action}</div>
}

function ProfileStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2.5 text-center"><div className="mx-auto flex w-fit text-purple-400">{icon}</div><p className="mt-1 text-xl font-bold text-white">{value}</p><p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p></div>
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-sm last:border-0 last:pb-0"><span className="flex items-center gap-2 text-gray-400">{icon}{label}</span><strong className="text-white">{value}</strong></div>
}

function ActivityRow({ manga }: { manga: { id: string; name: string; coverUrl: string | null; status: string | null; updatedAt: Date } }) {
  return <Link href={`/mangas/${manga.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03]"><div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-gray-800">{manga.coverUrl && <Image src={manga.coverUrl} alt="" fill sizes="36px" className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm text-gray-300">Atualizou <span className="font-semibold text-white">{manga.name}</span></p><p className="mt-1 text-xs text-gray-500">{statusLabel(manga.status)} · {formatDate(manga.updatedAt)}</p></div><Activity size={15} className="shrink-0 text-purple-400" /></Link>
}

function WorkCard({ manga, rank }: { manga: { id: string; name: string; author: string | null; coverUrl: string | null; note: number | null; ownedVolumes: number[]; totalVolumes: number | null }; rank: number }) {
  return <Link href={`/mangas/${manga.id}`} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900/60 transition hover:-translate-y-1 hover:border-purple-500/40"><div className="relative aspect-[3/4] bg-gray-800">{manga.coverUrl ? <Image src={manga.coverUrl} alt={`Capa de ${manga.name}`} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sm text-gray-500">Sem capa</div>}<span className="absolute left-2 top-2 rounded-md bg-gray-950/90 px-2 py-1 text-[10px] font-bold text-purple-300">#{rank}</span></div><div className="p-3"><h3 className="truncate text-sm font-semibold text-white">{manga.name}</h3><p className="mt-1 truncate text-xs text-gray-500">{manga.author || 'Autor não informado'}</p><div className="mt-3 flex items-center justify-between text-xs"><span className="text-gray-400">{manga.ownedVolumes.length}{manga.totalVolumes ? `/${manga.totalVolumes}` : ''} vol.</span>{manga.note !== null && <span className="flex items-center gap-1 text-purple-300"><Star size={12} fill="currentColor" />{manga.note.toFixed(1)}</span>}</div></div></Link>
}

function CollectionRow({ manga, showMissingVolumes = false }: { manga: { id: string; name: string; coverUrl: string | null; status: string | null; collectionType: string; ownedVolumes: number[]; totalVolumes: number | null; updatedAt: Date }; showMissingVolumes?: boolean }) {
  const progress = manga.totalVolumes ? Math.min(100, Math.round((manga.ownedVolumes.length / manga.totalVolumes) * 100)) : null
  const missingVolumes = showMissingVolumes ? getMissingVolumes(manga.totalVolumes, manga.ownedVolumes) : null
  return <div className="rounded-xl border border-white/[0.08] bg-gray-900/40 p-3 transition hover:border-purple-500/30 hover:bg-gray-900"><Link href={`/mangas/${manga.id}`} className="flex items-center gap-3"><div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gray-800">{manga.coverUrl && <Image src={manga.coverUrl} alt="" fill sizes="40px" className="object-cover" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-sm font-semibold text-white">{manga.name}</h3><span className="shrink-0 text-[10px] uppercase tracking-wider text-purple-300">{manga.collectionType === 'HQ' ? 'HQ' : 'Mangá'}</span></div><p className="mt-1 text-xs text-gray-500">{statusLabel(manga.status)} · {manga.ownedVolumes.length}{manga.totalVolumes ? `/${manga.totalVolumes}` : ''} volumes</p>{progress !== null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-purple-500" style={{ width: `${progress}%` }} /></div>}</div></Link>{showMissingVolumes && <div className="mt-2 border-t border-white/[0.06] pt-2">{missingVolumes === null ? <p className="text-[11px] text-gray-500">Total de volumes não informado</p> : missingVolumes.length === 0 ? <p className="text-[11px] text-emerald-300">Coleção completa</p> : <details><summary className="cursor-pointer list-none text-[11px] font-medium text-amber-300">Faltam {missingVolumes.length} {missingVolumes.length === 1 ? 'volume' : 'volumes'}</summary><p className="mt-1 text-[11px] leading-5 text-gray-400">Volumes: {missingVolumes.join(', ')}</p></details>}</div>}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="mt-5 rounded-xl border border-dashed border-white/[0.12] bg-gray-900/40 p-8 text-center text-sm text-gray-500">{text}</div>
}
