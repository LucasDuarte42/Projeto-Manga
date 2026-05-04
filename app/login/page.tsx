'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const { data: session, status } = useSession()





function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const { data: session, status } = useSession()

useEffect(() => {
  if (status === 'authenticated') router.push('/dashboard')
}, [status, router])

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccess('Conta criada com sucesso! Faça login.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (attempts >= 5) {
      setError('Muitas tentativas. Aguarde alguns minutos.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setAttempts(a => a + 1)
      setError(
        attempts >= 4
          ? 'Conta bloqueada temporariamente por excesso de tentativas.'
          : 'Email ou senha incorretos'
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-800">
      <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
      <p className="text-gray-400 text-sm mb-8">Entre na sua coleção de mangás</p>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
            placeholder="••••••••"
            required
          />
        </div>

        {attempts > 0 && attempts < 5 && (
          <p className="text-yellow-400 text-xs">
            {5 - attempts} tentativa{5 - attempts !== 1 ? 's' : ''} restante{5 - attempts !== 1 ? 's' : ''}
          </p>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || attempts >= 5}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-gray-400 text-sm text-center mt-6">
        Não tem conta?{' '}
        <Link href="/register" className="text-purple-400 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}