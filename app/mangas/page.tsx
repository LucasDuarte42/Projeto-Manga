'use client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const mangas = await prisma.manga.findMany({
    where: { userId: session.user.id },
  })

  const total = mangas.length
  const lidos = mangas.filter(m => m.status === 'READ').length
  const lendo = mangas.filter(m => m.status === 'READING').length
  const querLer = mangas.filter(m => m.status === 'WANT_TO_READ').length
  const completos = mangas.filter(m => m.totalVolumes && m.volume >= m.totalVolumes).length
  const notas = mangas.filter(m => m.note !== null).map(m => m.note as number)
  const media = notas.length > 0
    ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1)
    : '—'

  const totalVolumesUsuario = mangas.reduce((acc, m) => acc + m.volume, 0)
  const totalVolumesFaltando = mangas.reduce((acc, m) => {
    if (m.totalVolumes && m.volume < m.totalVolumes) {
      return acc + (m.totalVolumes - m.volume)
    }
    return acc
  }, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-purple-400">Pinakes Mangá</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Olá, {session.user.name || session.user.email}</span>
          <Link href="/mangas" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition">
            Minha Coleção
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">Dashboard</h2>

        {/* Stats principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-3xl font-bold">{total}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Lidos</p>
            <p className="text-3xl font-bold text-green-400">{lidos}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Lendo</p>
            <p className="text-3xl font-bold text-yellow-400">{lendo}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Quero Ler</p>
            <p className="text-3xl font-bold text-blue-400">{querLer}</p>
          </div>
        </div>

        {/* Stats de volumes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Volumes que tenho</p>
            <p className="text-3xl font-bold text-purple-400">{totalVolumesUsuario}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Volumes faltando</p>
            <p className="text-3xl font-bold text-red-400">{totalVolumesFaltando}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Colecoes completas</p>
            <p className="text-3xl font-bold text-green-400">{completos}</p>
          </div>
        </div>

        {/* Media */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-10 flex items-center gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Media de Notas</p>
            <p className="text-4xl font-bold text-purple-400">{media}</p>
          </div>
          <div className="text-gray-500 text-sm">
            Baseado em {notas.length} manga com nota
          </div>
        </div>

        {total === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-4">Sua colecao esta vazia</p>
            <Link href="/mangas" className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition">
              Adicionar primeiro manga
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}