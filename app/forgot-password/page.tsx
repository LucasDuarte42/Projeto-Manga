'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Ocorreu um erro. Tente novamente.'
        )
        return
      }

      setMessage(
        data.message ||
          'Se existir uma conta com este e-mail, enviaremos um link de recuperação.'
      )
    } catch {
      setError(
        'Não foi possível conectar ao servidor.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080d] px-4 py-10">

      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-[5%] top-[10%] h-80 w-80 rounded-full bg-purple-600/20 blur-[130px]" />

        <div className="absolute bottom-[5%] right-[5%] h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[150px]" />

        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.03] blur-[120px]" />

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
            Recupere o acesso à sua coleção.
          </p>

        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">

          {/* Linha superior */}
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

          <div className="mb-7">

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">

              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 15v2" />

                <circle
                  cx="12"
                  cy="10"
                  r="1"
                  fill="currentColor"
                />

                <rect
                  x="5"
                  y="4"
                  width="14"
                  height="16"
                  rx="2"
                />
              </svg>

            </div>

            <h2 className="text-2xl font-semibold text-white">
              Recuperar senha
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Informe o e-mail associado à sua conta e enviaremos um link para redefinir sua senha.
            </p>

          </div>

          {/* Mensagem de sucesso */}
          {message && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4">

              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                ✓
              </div>

              <div>

                <p className="text-sm font-medium text-green-300">
                  Solicitação enviada
                </p>

                <p className="mt-1 text-sm leading-5 text-green-400/80">
                  {message}
                </p>

              </div>

            </div>
          )}

          {/* Mensagem de erro */}
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

              <p className="text-sm leading-5 text-red-300">
                {error}
              </p>

            </div>
          )}

          {/* Se ainda não enviou */}
          {!message && (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Campo de email */}
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  E-mail da conta
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
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/70 focus:bg-purple-500/[0.03] focus:ring-4 focus:ring-purple-500/10"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01] hover:shadow-purple-700/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition duration-700 group-hover:translate-x-[100%]" />

                {loading ? (
                  <div className="flex items-center gap-2">

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

                    Enviando link...

                  </div>
                ) : (
                  <>
                    Enviar link de recuperação

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
          )}

          {/* Sucesso - opções */}
          {message && (
            <div className="space-y-3">

              <button
                type="button"
                onClick={() => {
                  setMessage('')
                  setEmail('')
                  setError('')
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-gray-300 transition hover:border-purple-500/30 hover:bg-purple-500/[0.06] hover:text-white"
              >
                Tentar outro e-mail
              </button>

            </div>
          )}

          {/* Divisor */}
          <div className="my-7 flex items-center gap-4">

            <div className="h-px flex-1 bg-white/[0.06]" />

            <span className="text-xs text-gray-600">
              lembrou sua senha?
            </span>

            <div className="h-px flex-1 bg-white/[0.06]" />

          </div>

          {/* Voltar */}
          <Link
            href="/login"
            className="group flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-gray-300 transition hover:border-purple-500/30 hover:bg-purple-500/[0.06] hover:text-white"
          >

            <svg
              viewBox="0 0 24 24"
              className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />

              <path d="m11 18-6-6 6-6" />
            </svg>

            Voltar para o login

          </Link>

        </div>

        {/* Informação */}
        <p className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-gray-600">

          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect
              x="5"
              y="10"
              width="14"
              height="10"
              rx="2"
            />

            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>

          O link de recuperação será enviado para seu e-mail.

        </p>

      </div>

    </main>
  )
}