'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getPasswordStrength(password)

  const requirements = [
    {
      label: 'Mínimo de 8 caracteres',
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

  function getStrengthColor() {
    if (strength === 1) return 'bg-red-500'
    if (strength === 2) return 'bg-yellow-500'
    if (strength === 3) return 'bg-blue-500'
    if (strength === 4) return 'bg-green-500'

    return 'bg-gray-700'
  }

  function getStrengthTextColor() {
    if (strength === 1) return 'text-red-400'
    if (strength === 2) return 'text-yellow-400'
    if (strength === 3) return 'text-blue-400'
    if (strength === 4) return 'text-green-400'

    return 'text-gray-500'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    if (strength < 4) {
      setError(
        'A senha precisa atender todos os requisitos.'
      )
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/register', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(
          data.error || 'Erro ao criar conta.'
        )
        return
      }

      router.push('/login?registered=true')
    } catch {
      setError(
        'Não foi possível criar sua conta. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080d] px-4 py-10">

      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-[5%] top-[5%] h-80 w-80 rounded-full bg-purple-600/20 blur-[130px]" />

        <div className="absolute bottom-[5%] right-[5%] h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[150px]" />

        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.03] blur-[120px]" />

      </div>

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
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
            Piankes<span className="text-purple-400">Manga</span>
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Comece a construir sua coleção.
          </p>

        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">

          {/* Linha superior */}
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

          <div className="mb-7">

            <h2 className="text-2xl font-semibold text-white">
              Criar sua conta
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Organize, acompanhe e avalie todos os mangás da sua coleção.
            </p>

          </div>

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

            {/* Nome */}
            <div>

              <label className="mb-2 block text-sm font-medium text-gray-300">
                Nome
              </label>

              <div className="group relative">

                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition group-focus-within:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-4 4.2-6 8-6s6.5 2 8 6" />
                </svg>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/70 focus:bg-purple-500/[0.03] focus:ring-4 focus:ring-purple-500/10"
                  placeholder="Seu nome"
                  autoComplete="name"
                  minLength={2}
                  required
                />

              </div>

            </div>

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

              <label className="mb-2 block text-sm font-medium text-gray-300">
                Crie uma senha
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
                  placeholder="Crie uma senha segura"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
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
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />
                    </svg>
                  )}

                </button>

              </div>

              {/* Força da senha */}
              {password && (
                <div className="mt-3">

                  <div className="mb-2 flex gap-1.5">

                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          item <= strength
                            ? getStrengthColor()
                            : 'bg-white/[0.06]'
                        }`}
                      />
                    ))}

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="text-xs text-gray-500">
                      Segurança da senha
                    </span>

                    <span
                      className={`text-xs font-medium ${getStrengthTextColor()}`}
                    >
                      {strengthLabel[strength]}
                    </span>

                  </div>

                </div>
              )}

              {/* Requisitos */}
              {password && (
                <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/10 p-3">

                  <p className="mb-2 text-xs font-medium text-gray-400">
                    Sua senha precisa ter:
                  </p>

                  <ul className="grid grid-cols-1 gap-2">

                    {requirements.map((requirement) => (
                      <li
                        key={requirement.label}
                        className={`flex items-center gap-2 text-xs transition ${
                          requirement.valid
                            ? 'text-green-400'
                            : 'text-gray-500'
                        }`}
                      >

                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                            requirement.valid
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-gray-700 text-gray-600'
                          }`}
                        >
                          {requirement.valid ? '✓' : ''}
                        </span>

                        {requirement.label}

                      </li>
                    ))}

                  </ul>

                </div>
              )}

            </div>

            {/* Confirmar senha */}
            <div>

              <label className="mb-2 block text-sm font-medium text-gray-300">
                Confirmar senha
              </label>

              <div className="group relative">

                <svg
                  viewBox="0 0 24 24"
                  className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition ${
                    confirm && password === confirm
                      ? 'text-green-400'
                      : confirm && password !== confirm
                        ? 'text-red-400'
                        : 'text-gray-500 group-focus-within:text-purple-400'
                  }`}
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
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`h-12 w-full rounded-xl border bg-black/20 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:ring-4 ${
                    confirm && password !== confirm
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
                      : confirm && password === confirm
                        ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/10'
                        : 'border-white/[0.08] focus:border-purple-500/70 focus:bg-purple-500/[0.03] focus:ring-purple-500/10'
                  }`}
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm(!showConfirm)
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
                  aria-label={
                    showConfirm
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >
                  {showConfirm ? (
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
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />
                    </svg>
                  )}
                </button>

              </div>

              {confirm && password !== confirm && (
                <p className="mt-2 text-xs text-red-400">
                  As senhas não coincidem.
                </p>
              )}

              {confirm && password === confirm && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                  <span>✓</span>
                  As senhas coincidem.
                </p>
              )}

            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={
                loading ||
                strength < 4 ||
                password !== confirm
              }
              className="group relative mt-2 flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01] hover:shadow-purple-700/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
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

                  Criando conta...

                </div>
              ) : (
                <>
                  Criar minha conta

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
              já possui uma conta?
            </span>

            <div className="h-px flex-1 bg-white/[0.06]" />

          </div>

          {/* Login */}
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-gray-300 transition hover:border-purple-500/30 hover:bg-purple-500/[0.06] hover:text-white"
          >
            Entrar na minha conta
          </Link>

        </div>

        <p className="mt-7 text-center text-xs text-gray-600">
          Crie sua conta e comece a organizar sua coleção.
        </p>

      </div>

    </main>
  )
}