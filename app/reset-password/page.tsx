'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function getPasswordStrength(password: string) {
  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  return score
}

const strengthLabel = [
  '',
  'Fraca',
  'Razoável',
  'Boa',
  'Forte',
]

const strengthColor = [
  '',
  'bg-red-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-green-500',
]

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(password)

  const requirements = [
    {
      label: 'Mínimo 8 caracteres',
      valid: password.length >= 8,
    },
    {
      label: 'Uma letra maiúscula',
      valid: /[A-Z]/.test(password),
    },
    {
      label: 'Um número',
      valid: /[0-9]/.test(password),
    },
    {
      label: 'Um caractere especial',
      valid: /[^a-zA-Z0-9]/.test(password),
    },
  ]

  function goBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!token) {
      setError(
        'Link de recuperação inválido.'
      )
      return
    }

    if (strength < 4) {
      setError(
        'A senha não atende todos os requisitos.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError(
        'As senhas não coincidem.'
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        '/api/auth/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível alterar a senha.'
        )

        return
      }

      setSuccess(
        'Senha alterada com sucesso!'
      )

      setPassword('')
      setConfirmPassword('')
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
            onClick={goBack}
            className="group absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-gray-500 transition hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
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

      {/* Grid */}
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

            <div className="relative h-24 w-24 overflow-hidden rounded-2xl shadow-2xl shadow-purple-900/40">
              <Image src="/brand/logo.png" alt="Pinakes" fill sizes="96px" className="object-cover" priority />
            </div>

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
              Pinakes Manga
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Crie uma nova senha para sua conta.
          </p>

        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">

          {/* Linha superior */}
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

          

          {!token ? (
            <div className="py-10 text-center">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">

                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />

                  <path d="M12 8v4" />

                  <path d="M12 16h.01" />
                </svg>

              </div>

              <h2 className="text-xl font-semibold text-white">
                Link inválido
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                O link de recuperação não contém
                um token válido ou já expirou.
              </p>

              <Link
                href="/forgot-password"
                className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01]"
              >
                Solicitar nova recuperação
              </Link>

            </div>
          ) : success ? (
            <div className="py-8 text-center">

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">

                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>

              </div>

              <h2 className="text-2xl font-semibold text-white">
                Senha alterada!
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Sua senha foi atualizada com sucesso.
                Agora você já pode acessar sua conta.
              </p>

              <Link
                href="/login"
                className="group mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01]"
              >
                Ir para o login

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

              </Link>

            </div>
          ) : (
            <>
              {/* Cabeçalho */}
              <div className="mb-7 pt-7">

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
                  Criar nova senha
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Escolha uma senha forte para manter sua conta protegida.
                </p>

              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">

                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>

                  <p className="text-sm leading-5 text-red-300">
                    {error}
                  </p>

                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Nova senha */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Nova senha
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/70 focus:bg-purple-500/[0.03] focus:ring-4 focus:ring-purple-500/10"
                  />

                  {password && (
                    <div className="mt-3">

                      <div className="mb-2 flex gap-1">

                        {[1, 2, 3, 4].map(
                          (item) => (
                            <div
                              key={item}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                item <= strength
                                  ? strengthColor[
                                      strength
                                    ]
                                  : 'bg-white/[0.06]'
                              }`}
                            />
                          )
                        )}

                      </div>

                      <p className="text-xs text-gray-500">
                        Força da senha:{' '}

                        <span className="font-medium text-gray-300">
                          {
                            strengthLabel[
                              strength
                            ]
                          }
                        </span>
                      </p>

                    </div>
                  )}

                  {password && (
                    <ul className="mt-4 space-y-2">

                      {requirements.map(
                        (requirement) => (
                          <li
                            key={requirement.label}
                            className="flex items-center gap-2 text-xs"
                          >

                            <span
                              className={
                                requirement.valid
                                  ? 'flex h-4 w-4 items-center justify-center rounded-full bg-green-500/10 text-green-400'
                                  : 'flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.04] text-gray-600'
                              }
                            >
                              {requirement.valid
                                ? '✓'
                                : '○'}
                            </span>

                            <span
                              className={
                                requirement.valid
                                  ? 'text-green-400'
                                  : 'text-gray-500'
                              }
                            >
                              {requirement.label}
                            </span>

                          </li>
                        )
                      )}

                    </ul>
                  )}

                </div>

                {/* Confirmar senha */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Confirmar nova senha
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className={`h-12 w-full rounded-xl border bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:ring-4 ${
                      confirmPassword &&
                      password !== confirmPassword
                        ? 'border-red-500/70 focus:ring-red-500/10'
                        : 'border-white/[0.08] focus:border-purple-500/70 focus:bg-purple-500/[0.03] focus:ring-purple-500/10'
                    }`}
                  />

                  {confirmPassword &&
                    password !== confirmPassword && (
                      <p className="mt-2 text-xs text-red-400">
                        As senhas não coincidem.
                      </p>
                    )}

                  {confirmPassword &&
                    password === confirmPassword && (
                      <p className="mt-2 text-xs text-green-400">
                        ✓ As senhas coincidem.
                      </p>
                    )}

                </div>

                {/* Botão */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    strength < 4 ||
                    password !== confirmPassword
                  }
                  className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01] hover:shadow-purple-700/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >

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

                      Alterando senha...

                    </div>
                  ) : (
                    <>
                      Alterar senha

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
            </>
          )}

        </div>

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

          Sua nova senha será armazenada com segurança.
        </p>

      </div>

    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#08080d]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />

            <span className="text-sm text-gray-500">
              Carregando...
            </span>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}