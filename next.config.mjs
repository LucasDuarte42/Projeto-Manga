import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const scriptSources = process.env.NODE_ENV === 'development'
  ? "'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live"
  : "'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live"

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://graphql.anilist.co https://openlibrary.org https://covers.openlibrary.org https://*.sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com",
  "frame-src 'self'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's4.anilist.co', pathname: '/file/anilistcdn/**' },
      { protocol: 'https', hostname: 's3.anilist.co', pathname: '/file/anilistcdn/**' },
      { protocol: 'https', hostname: 'covers.openlibrary.org', pathname: '/**' },
      { protocol: 'https', hostname: 'd14d9vp3wdof84.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: 'static.wikia.nocookie.net', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
})
