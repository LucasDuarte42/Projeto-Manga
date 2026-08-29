import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { hashShareToken } from '@/lib/share-token'

export const dynamic = 'force-dynamic'

export default async function SharedCollectionPage({ params }: { params: { token: string } }) {
  const share = await prisma.collectionShare.findUnique({
    where: { tokenHash: hashShareToken(params.token) },
    select: {
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          name: true,
          mangas: {
            orderBy: { name: 'asc' },
            select: {
              name: true,
              author: true,
              coverUrl: true,
              status: true,
              collectionType: true,
              totalVolumes: true,
              ownedVolumes: true,
              totalChapters: true,
              readChapters: true,
            },
          },
        },
      },
    },
  })

  if (!share || share.revokedAt || (share.expiresAt && share.expiresAt < new Date())) {
    notFound()
  }

  const ownerName = share.user.name?.trim() || 'Colecionador'

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/brand/logo.png" alt="Pinakes Manga" width={42} height={42} className="object-cover" priority />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">Pinakes Manga</p>
            <h1 className="text-2xl font-bold sm:text-3xl">Coleção de {ownerName}</h1>
          </div>
        </div>

        {share.user.mangas.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-gray-900/50 p-8 text-center text-gray-400">Esta coleção ainda não possui obras compartilháveis.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {share.user.mangas.map((manga) => {
              const volumeProgress = manga.totalVolumes ? `${manga.ownedVolumes.length}/${manga.totalVolumes} volumes` : `${manga.ownedVolumes.length} volumes`
              const chapterProgress = manga.totalChapters ? `${manga.readChapters.length}/${manga.totalChapters} capítulos` : null
              const ownedVolumeNumbers = new Set(manga.ownedVolumes.filter((number) => Number.isInteger(number) && number > 0))
              const missingVolumes = manga.totalVolumes
                ? Array.from({ length: manga.totalVolumes }, (_, index) => index + 1).filter((number) => !ownedVolumeNumbers.has(number))
                : []
              return (
                <article key={`${manga.name}-${manga.collectionType}`} className="flex gap-4 rounded-2xl border border-white/10 bg-gray-900/60 p-4 shadow-xl shadow-black/10">
                  <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-800">
                    {manga.coverUrl ? <Image src={manga.coverUrl} alt={`Capa de ${manga.name}`} fill sizes="80px" className="object-cover" /> : <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-500">Sem capa</div>}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-white">{manga.name}</h2>
                    {manga.author && <p className="mt-1 truncate text-sm text-gray-400">{manga.author}</p>}
                    <p className="mt-3 text-xs text-purple-300">{manga.collectionType === 'HQ' ? 'HQ' : 'Mangá'}</p>
                    <p className="mt-1 text-xs text-gray-400">{volumeProgress}</p>
                    {missingVolumes.length > 0 && <p className="mt-1 text-xs leading-5 text-amber-300">Faltantes: {missingVolumes.join(', ')}</p>}
                    {manga.totalVolumes && missingVolumes.length === 0 && <p className="mt-1 text-xs text-emerald-300">Coleção completa</p>}
                    {chapterProgress && <p className="mt-1 text-xs text-gray-400">{chapterProgress}</p>}
                    <p className="mt-1 text-xs text-gray-500">{manga.status === 'READ' ? 'Lido' : manga.status === 'READING' ? 'Lendo' : 'Quero ler'}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
