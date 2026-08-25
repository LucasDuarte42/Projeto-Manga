import { expect, type Page } from '@playwright/test'
import crypto from 'node:crypto'

export const e2ePassword = 'E2e!Password123'

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}@example.test`
}

export async function registerUser(
  page: Page,
  user: { name: string; email: string; password?: string }
): Promise<void> {
  const password = user.password ?? e2ePassword

  await page.goto('/register')
  await page.getByPlaceholder('Seu nome').fill(user.name)
  await page.getByPlaceholder('seu@email.com').fill(user.email)
  await page.getByPlaceholder('Crie uma senha segura').fill(password)
  await page.getByPlaceholder('Confirme sua senha').fill(password)
  await page.getByRole('button', { name: /criar conta/i }).click()

  await expect(page).toHaveURL(/\/login\?registered=1/)
}

export async function loginUser(
  page: Page,
  user: { email: string; password?: string }
): Promise<void> {
  await page.goto('/login')
  await page.getByPlaceholder('seu@email.com').fill(user.email)
  await page.getByPlaceholder('Digite sua senha').fill(user.password ?? e2ePassword)
  await page.getByRole('button', { name: /entrar na minha coleção/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole('button', { name: /sair da conta/i }).click()
  await expect(page).toHaveURL(/\/login/)
}
