import { defineConfig, devices } from '@playwright/test'

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL

if (!e2eDatabaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL não configurada. Defina uma URL PostgreSQL exclusiva para testes antes de executar os testes E2E.'
  )
}

// O Next.js iniciado pelo webServer e os testes usam o banco isolado de E2E.
process.env.DATABASE_URL = e2eDatabaseUrl
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000'
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || 'e2e-only-secret-change-me'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run e2e:server',
    url: 'http://127.0.0.1:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
