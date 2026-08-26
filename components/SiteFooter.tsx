import Image from 'next/image'
import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-gray-950/80 px-6 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Pinakes Manga - página inicial">
              <Image src="/brand/logo.png" alt="" width={44} height={44} className="block object-cover" />
              <span className="text-lg font-bold text-white">Pinakes Manga</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
              Organize, acompanhe e aproveite sua coleção de mangás e HQs em um só lugar.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Navegação</h2>
            <nav className="mt-4 flex flex-col items-start gap-3 text-sm text-gray-500" aria-label="Navegação do rodapé">
              <Link href="/" className="transition hover:text-white">Início</Link>
              <Link href="/login" className="transition hover:text-white">Entrar</Link>
              <Link href="/register" className="transition hover:text-white">Criar conta</Link>
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Sua coleção</h2>
            <p className="mt-4 text-sm leading-6 text-gray-500">
              Depois de entrar, acesse seu dashboard e acompanhe seus volumes, progresso e avaliações.
            </p>
            <Link href="/login" className="mt-4 inline-flex text-sm font-medium text-purple-300 transition hover:text-purple-200">
              Acessar minha coleção <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pinakes Manga. Feito para quem gosta de colecionar.</p>
          <p>Organize. Leia. Colecione.</p>
        </div>
      </div>
    </footer>
  )
}
