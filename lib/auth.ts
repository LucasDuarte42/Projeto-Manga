import { NextAuthOptions, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { loginSchema } from './validations'
import { consumeRateLimit } from './security'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const forwardedFor = req.headers?.['x-forwarded-for']
        const ip = Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : forwardedFor?.split(',')[0]?.trim() || 'unknown'

        const windowMs = 15 * 60 * 1000
        const [allowedByIdentity, allowedByIp] = await Promise.all([
          consumeRateLimit(`login:identity:${ip}:${email}`, 5, windowMs),
          consumeRateLimit(`login:ip:${ip}`, 20, windowMs),
        ])

        if (!allowedByIdentity || !allowedByIp) return null
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        )

        if (!passwordMatch) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
  async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
    if (token?.id) {
      const userExists = await prisma.user.findUnique({ where: { id: token.id as string } })
      if (!userExists) {
        return { ...session, user: undefined as any }
      }
      session.user.id = token.id as string
    }
    return session
  },
  async jwt({ token, user }: { token: JWT; user?: any }): Promise<JWT> {
    if (user) {
      token.id = user.id
    }
    return token
  },
},
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
