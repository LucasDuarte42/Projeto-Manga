import { test, expect } from '@playwright/test'
import { e2ePassword, loginUser, logoutUser, registerUser, uniqueEmail } from './helpers'

test.describe('autenticação e autorização com PostgreSQL real', () => {
  test('permite cadastrar, entrar e sair da conta', async ({ page }) => {
    const user = {
      name: 'Usuário E2E',
      email: uniqueEmail('auth'),
      password: e2ePassword,
    }

    await registerUser(page, user)
    await loginUser(page, user)
    await expect(page.getByRole('heading', { name: /visão geral|dashboard/i })).toBeVisible()

    await logoutUser(page)
    await expect(page.getByPlaceholder('seu@email.com')).toBeVisible()
  })

  test('bloqueia acesso à coleção sem sessão', async ({ request }) => {
    const response = await request.get('/api/mangas')

    expect(response.status()).toBe(401)
  })

  test('impede que um usuário acesse o mangá de outro usuário', async ({ page, browser }) => {
    const owner = {
      name: 'Proprietário E2E',
      email: uniqueEmail('owner'),
      password: e2ePassword,
    }
    const otherUser = {
      name: 'Outro Usuário E2E',
      email: uniqueEmail('other'),
      password: e2ePassword,
    }

    await registerUser(page, owner)
    await loginUser(page, owner)

    const ownerMangaResponse = await page.request.post('/api/mangas', {
      data: {
        name: `Mangá privado ${Date.now()}`,
        author: 'Autor E2E',
        collectionType: 'MANGA',
        status: 'WANT_TO_READ',
        volume: 1,
      },
    })

    expect(ownerMangaResponse.status()).toBe(201)
    const ownerManga = await ownerMangaResponse.json()

    const otherContext = await browser.newContext()
    const otherPage = await otherContext.newPage()

    try {
      await registerUser(otherPage, otherUser)
      await loginUser(otherPage, otherUser)

      const listResponse = await otherPage.request.get('/api/mangas')
      expect(listResponse.status()).toBe(200)
      expect(await listResponse.json()).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: ownerManga.id }),
        ])
      )

      const detailResponse = await otherPage.request.get(`/api/mangas/${ownerManga.id}`)
      expect(detailResponse.status()).toBe(404)

      const updateResponse = await otherPage.request.put(`/api/mangas/${ownerManga.id}`, {
        data: { name: 'Tentativa de alteração indevida' },
      })
      expect(updateResponse.status()).toBe(404)

      const deleteResponse = await otherPage.request.delete(`/api/mangas/${ownerManga.id}`)
      expect(deleteResponse.status()).toBe(404)
    } finally {
      await otherContext.close()
    }

    const ownerDetailResponse = await page.request.get(`/api/mangas/${ownerManga.id}`)
    expect(ownerDetailResponse.status()).toBe(200)
  })
})
