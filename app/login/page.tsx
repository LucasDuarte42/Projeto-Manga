'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      window.location.href = '/dashboard'
    }
  }, [status])

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccess('Conta criada com sucesso! Agora é só entrar.')
    }

    if (searchParams.get('reset')) {
      setSuccess('Senha alterada com sucesso! Faça login com sua nova senha.')
    }
  }, [searchParams])

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    if (attempts >= 5) {
      setError('Muitas tentativas. Aguarde alguns minutos.')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setAttempts((current) => current + 1)

        setError(
          attempts >= 4
            ? 'Conta bloqueada temporariamente.'
            : 'E-mail ou senha incorretos.'
        )

        return
      }

      if (result?.ok) {
        window.location.href = '/dashboard'
        return
      }

      setError('Erro inesperado. Tente novamente.')
    } catch {
      setError('Não foi possível realizar o login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080d] px-4 py-8">
      
      {/* Fundo decorativo */}
      
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        
        <div className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="absolute bottom-[5%] right-[5%] h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[140px]" />

        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.03] blur-[100px]" />
      </div>

    {/* Botão voltar */}
      <button
        type="button"
        onClick={() => router.back()}
        className="group absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-gray-500 transition hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300 sm:left-5 sm:top-5"
        aria-label="Voltar"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 transition-transform group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5" />
          <path d="m11 18-6-6 6-6" />
        </svg>
      </button>
      {/* Grid de fundo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-purple-500/40 blur-xl" />

            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-purple-400/30 bg-gray-950 shadow-2xl shadow-purple-900/40">
              <Image src="/brand/logo.png" alt="Pinakes" fill sizes="96px" className="object-cover" priority />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Manga<span className="text-purple-400">Vault</span>
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sua coleção. Organizada do seu jeito.
          </p>
        </div>
        

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          
          
          {/* Linha superior */}
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-white">
              Bem-vindo de volta
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Entre na sua conta para continuar acompanhando sua coleção.
            </p>
          </div>

          {/* Sucesso */}
          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>

              <p className="text-sm text-emerald-300">
                {success}
              </p>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>

              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                E-mail
              </label>

              <div className="group relative">
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition group-focus-within:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />
                  <path d="m3 7 9 6 9-6" />
                </svg>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/70 focus:bg-purple-500/[0.03] focus:ring-4 focus:ring-purple-500/10"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Senha
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-purple-400 transition hover:text-purple-300"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <div className="group relative">
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition group-focus-within:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="10"
                    rx="2"
                  />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/70 focus:bg-purple-500/[0.03] focus:ring-4 focus:ring-purple-500/10"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
                  aria-label={
                    showPassword
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.5 4.7 10 8-.2 1.3-1 2.9-2.2 4.3" />
                      <path d="M6.6 6.6C4.6 8 3.3 10.2 3 12c.5 3.3 4.5 8 9 8 1.5 0 2.9-.5 4.1-1.2" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Tentativas */}
            {attempts > 0 && attempts < 5 && (
              <div className="rounded-lg border border-yellow-500/10 bg-yellow-500/[0.06] px-3 py-2">
                <p className="text-xs text-yellow-400">
                  {5 - attempts} tentativa
                  {5 - attempts !== 1 ? 's' : ''} restante
                  {5 - attempts !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading || attempts >= 5}
              className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01] hover:shadow-purple-700/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition duration-700 group-hover:translate-x-[100%]" />

              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3z"
                  />
                </svg>
              ) : (
                <>
                  Entrar na minha coleção

                  <svg
                    viewBox="0 0 24 24"
                    className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs text-gray-600">
              ainda não possui uma conta?
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Cadastro */}
          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-gray-300 transition hover:border-purple-500/30 hover:bg-purple-500/[0.06] hover:text-white"
          >
            Criar uma conta
          </Link>
        </div>

        {/* Rodapé */}
        <p className="mt-7 text-center text-xs text-gray-600">
          Organize, acompanhe e avalie sua coleção.
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08080d]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}