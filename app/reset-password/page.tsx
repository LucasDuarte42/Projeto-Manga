'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()

  const token =
    searchParams.get('token') || ''

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [loading, setLoading] =
    useState(false)

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

    if (password.length < 6) {
      setError(
        'A senha deve ter pelo menos 6 caracteres.'
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

  if (!token) {
    return (
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-800 text-center">
        <h1 className="text-xl font-bold text-white mb-4">
          Link inválido
        </h1>

        <p className="text-gray-400 text-sm mb-6">
          O link de recuperação não contém um token válido.
        </p>

        <Link
          href="/forgot-password"
          className="text-purple-400 hover:underline"
        >
          Solicitar nova recuperação
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-800">
      <h1 className="text-2xl font-bold text-white mb-2">
        Criar nova senha
      </h1>

      <p className="text-gray-400 text-sm mb-8">
        Escolha uma nova senha para sua conta.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success ? (
        <div>
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg mb-6">
            {success}
          </div>

          <Link
            href="/login"
            className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Ir para o login
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Nova senha
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              minLength={6}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Confirmar nova senha
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="••••••••"
              minLength={6}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Alterando senha...'
              : 'Alterar senha'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Suspense
        fallback={
          <div className="text-white">
            Carregando...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}