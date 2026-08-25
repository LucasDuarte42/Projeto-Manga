import { describe, expect, it } from 'vitest'
import {
  emailSchema,
  mangaCreateSchema,
  passwordSchema,
  resetPasswordSchema,
  searchQuerySchema,
  volumeRatingSchema,
} from './validations'
import { hashResetToken } from './security'

describe('schemas de autenticação', () => {
  it('normaliza e valida e-mails', () => {
    expect(emailSchema.parse('  USER@Example.COM ')).toBe('user@example.com')
  })

  it('rejeita senhas sem os requisitos mínimos', () => {
    expect(passwordSchema.safeParse('senha-fraca').success).toBe(false)
    expect(passwordSchema.safeParse('SenhaForte1!').success).toBe(true)
  })

  it('usa a mesma política forte no reset de senha', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: '123456' }).success).toBe(false)
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'SenhaForte1!' }).success).toBe(true)
  })
})

describe('schemas de coleção', () => {
  it('aplica defaults seguros ao criar um mangá', () => {
    const result = mangaCreateSchema.parse({ name: 'Naruto' })
    expect(result.volume).toBe(1)
    expect(result.status).toBe('WANT_TO_READ')
    expect(result.collectionType).toBe('MANGA')
  })

  it('rejeita avaliação fora do intervalo permitido', () => {
    expect(volumeRatingSchema.safeParse({ volume: 1, note: 11 }).success).toBe(false)
    expect(volumeRatingSchema.safeParse({ volume: 1, note: 8.5 }).success).toBe(true)
  })

  it('exige consulta curta e não vazia para buscas', () => {
    expect(searchQuerySchema.safeParse({ q: '  ' }).success).toBe(false)
    expect(searchQuerySchema.safeParse({ q: 'Naruto' }).success).toBe(true)
    expect(searchQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false)
  })

  it('aceita apenas capas HTTPS', () => {
    expect(mangaCreateSchema.safeParse({
      name: 'Seguro',
      coverUrl: 'https://images.example.com/cover.jpg',
    }).success).toBe(true)
    expect(mangaCreateSchema.safeParse({
      name: 'Inseguro',
      coverUrl: 'http://images.example.com/cover.jpg',
    }).success).toBe(false)
  })
})

describe('tokens de recuperação', () => {
  it('produz hash determinístico e não reversível no fluxo normal', () => {
    expect(hashResetToken('token-de-teste')).toBe(hashResetToken('token-de-teste'))
    expect(hashResetToken('token-de-teste')).not.toBe('token-de-teste')
  })
})
