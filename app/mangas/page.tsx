import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import MangasClient from '@/components/mangas-client'

export default async function MangasPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const mangas = await prisma.manga.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-purple-400">Pinakes Mangá</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Olá, {session.user.name || session.user.email}</span>
          <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">Minha Coleção</h2>
        <MangasClient initialMangas={mangas} />
      </main>
    </div>
  )
}
