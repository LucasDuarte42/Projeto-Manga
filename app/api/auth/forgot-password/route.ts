import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

interface ForgotPasswordBody {
  email?: unknown
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ForgotPasswordBody

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : ''

    const response = {
      message:
        'Se existir uma conta com este e-mail, você receberá instruções para redefinir sua senha.',
    }

    if (!email) {
      return NextResponse.json(response)
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return NextResponse.json(response)
    }

    // Remove tokens antigos desse usuário
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    })

    // Cria um token aleatório
    const token = crypto
      .randomBytes(32)
      .toString('hex')

    // Token válido por 1 hora
    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    )

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    const resetUrl =
      `${appUrl}/reset-password?token=${encodeURIComponent(token)}`

    // POR ENQUANTO:
    // O link aparece no terminal.
    console.log('')
    console.log('========================================')
    console.log('RECUPERAÇÃO DE SENHA')
    console.log('========================================')
    console.log(resetUrl)
    console.log('========================================')
    console.log('')

    return NextResponse.json(response)
  } catch (error) {
    console.error(
      'Erro ao solicitar recuperação de senha:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Não foi possível processar sua solicitação.',
      },
      {
        status: 500,
      }
    )
  }
}