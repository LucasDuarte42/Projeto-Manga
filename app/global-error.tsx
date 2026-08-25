'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-center text-white">
        <main>
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="mt-3 text-gray-400">
            Ocorreu um erro inesperado. Tente novamente.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-700"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}
