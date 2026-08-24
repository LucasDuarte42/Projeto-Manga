import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'

interface ResetPasswordBody {
  token?: unknown
  password?: unknown
}

export async function POST(req: NextRequest) {
  try {
    const body =
      (await req.json()) as ResetPasswordBody

    const token =
      typeof body.token === 'string'
        ? body.token
        : ''

    const password =
      typeof body.password === 'string'
        ? body.password
        : ''

    if (!token || !password) {
      return NextResponse.json(
        {
          error: 'Dados inválidos.',
        },
        {
          status: 400,
        }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            'A senha deve ter pelo menos 6 caracteres.',
        },
        {
          status: 400,
        }
      )
    }

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          token,
        },
      })

    if (!resetToken) {
      return NextResponse.json(
        {
          error:
            'Este link é inválido ou já foi utilizado.',
        },
        {
          status: 400,
        }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      })

      return NextResponse.json(
        {
          error:
            'Este link expirou. Solicite uma nova recuperação.',
        },
        {
          status: 400,
        }
      )
    }

    const hashedPassword =
      await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: hashedPassword,
        },
      }),

      prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      }),
    ])

    return NextResponse.json({
      message:
        'Senha alterada com sucesso.',
    })
  } catch (error) {
    console.error(
      'Erro ao redefinir senha:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Não foi possível redefinir a senha.',
      },
      {
        status: 500,
      }
    )
  }
}