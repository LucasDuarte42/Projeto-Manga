import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="px-6 py-5 flex items-center justify-between border-b border-gray-800/50">
        <h1 className="text-xl font-bold text-purple-400">Pinakes Mangá</h1>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition px-4 py-2">
            Entrar
          </Link>
          <Link href="/register" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Criar conta
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium px-4 py-2 rounded-full mb-8">
          Inspirado na Biblioteca de Alexandria
        </div>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight max-w-3xl">
          Sua coleção de mangás,{' '}
          <span className="text-purple-400">organizada</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          Gerencie sua coleção de mangás e HQs. Acompanhe o que está lendo,
          o que já leu e o que quer ler — tudo em um só lugar.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/register" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition text-lg">
            Começar agora
          </Link>
          <Link href="/login" className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition text-lg">
            Já tenho conta
          </Link>
        </div>
      </main>

      <section className="max-w-5xl mx-auto px-6 py-20 w-full">
        <h3 className="text-2xl font-bold text-center mb-12 text-gray-300">Tudo que você precisa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">📚</div>
            <h4 className="font-semibold text-lg mb-2">Coleção completa</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Adicione mangás com capa, gênero, volume e nota. Busca automática pelo MyAnimeList.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">📊</div>
            <h4 className="font-semibold text-lg mb-2">Dashboard completo</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Veja estatísticas da sua coleção: quantos lidos, lendo, média de notas e muito mais.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">🔍</div>
            <h4 className="font-semibold text-lg mb-2">Filtros avançados</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Busque por nome, filtre por status e encontre qualquer mangá da sua coleção rapidamente.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-6 text-center">
        <p className="text-gray-600 text-sm">
          Pinakes Mangá — Inspirado no catálogo da Biblioteca de Alexandria
        </p>
      </footer>
    </div>
  )
}