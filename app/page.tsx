import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen overflow-hidden bg-gray-950 text-white">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[400px] w-[400px] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 font-bold shadow-lg shadow-purple-900/30">
            P
          </div>

          <div>
            <h1 className="text-lg font-bold leading-none">
              Pinakes
            </h1>
            <span className="text-xs text-purple-400">
              Mangá Collection
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Entrar
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-purple-700 hover:scale-[1.02]"
          >
            Criar conta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-20 text-center md:pt-32">

        {/* Badge */}
        <div className="mb-8 flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
          Organize sua coleção em um só lugar
        </div>

        <h2 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Sua coleção merece
          <span className="block bg-gradient-to-r from-purple-400 via-violet-400 leading-[1.2] to-purple-600 bg-clip-text text-transparent">
            um lugar especial.
          </span>
        </h2>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
          Organize seus mangás, acompanhe sua leitura e descubra
          estatísticas sobre a sua coleção — tudo de forma simples,
          rápida e bonita.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-8 py-4 font-semibold text-white shadow-xl shadow-purple-900/30 transition hover:bg-purple-700 hover:shadow-purple-700/20"
          >
            Começar minha coleção
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-gray-800 bg-gray-900/50 px-8 py-4 font-semibold text-gray-300 transition hover:border-gray-700 hover:bg-gray-900 hover:text-white"
          >
            Já tenho uma conta
          </Link>
        </div>

        <p className="mt-5 text-xs text-gray-600">
          Simples, rápido e feito para colecionadores.
        </p>
      </main>

      

      {/* Features */}
      <section className="relative z-10 border-t border-gray-900 bg-gray-950/60 px-6 py-28">

        <div className="mx-auto max-w-6xl">

          <div className="mx-auto mb-16 max-w-xl text-center">
            <span className="text-sm font-semibold text-purple-400">
              TUDO EM UM SÓ LUGAR
            </span>

            <h3 className="mt-4 text-3xl font-bold md:text-4xl">
              Feito para quem ama mangás.
            </h3>

            <p className="mt-4 text-gray-400">
              Tenha controle total sobre sua coleção sem planilhas
              complicadas ou anotações perdidas.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            <div className="group rounded-2xl border border-gray-800 bg-gray-900/40 p-7 transition hover:-translate-y-1 hover:border-purple-500/40 hover:bg-gray-900">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                📚
              </div>

              <h4 className="text-lg font-semibold">
                Sua coleção completa
              </h4>

              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                Adicione mangás, volumes, capas, gêneros e avaliações
                para manter tudo organizado.
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-800 bg-gray-900/40 p-7 transition hover:-translate-y-1 hover:border-purple-500/40 hover:bg-gray-900">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                📈
              </div>

              <h4 className="text-lg font-semibold">
                Estatísticas da coleção
              </h4>

              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                Descubra seus hábitos de leitura e acompanhe o crescimento
                da sua coleção.
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-800 bg-gray-900/40 p-7 transition hover:-translate-y-1 hover:border-purple-500/40 hover:bg-gray-900">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                🔎
              </div>

              <h4 className="text-lg font-semibold">
                Encontre rapidamente
              </h4>

              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                Pesquise, filtre por status e encontre qualquer obra
                da sua coleção em segundos.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-28">

        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 via-gray-900 to-gray-950 px-6 py-20 text-center">

          <h3 className="text-3xl font-bold md:text-5xl">
            Sua coleção começa aqui.
          </h3>

          <p className="mx-auto mt-5 max-w-xl text-gray-400">
            Pare de perder o controle dos seus mangás.
            Organize tudo em um único lugar.
          </p>

          <Link
            href="/register"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:bg-purple-700 hover:scale-105"
          >
            Criar minha conta
            <span>→</span>
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900 px-6 py-8">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-gray-600 md:flex-row">

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-600 text-xs font-bold text-white">
              P
            </div>

            Pinakes Mangá
          </div>

          <p>
            Organize. Leia. Colecione.
          </p>

        </div>
      </footer>

    </div>
  )
}