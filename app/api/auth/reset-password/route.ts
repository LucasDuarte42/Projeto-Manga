import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations'
import { hashResetToken, consumeRateLimit, getClientIp } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)

    if (!(await consumeRateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data
    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          token: hashResetToken(token),
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