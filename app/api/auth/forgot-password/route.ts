import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
        'Se existir uma conta com este e-mail, você receberá as instruções para redefinir sua senha.',
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

    // Remove tokens antigos
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    })

    // Cria um token seguro
    const token = crypto.randomBytes(32).toString('hex')

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

    const { error } = await resend.emails.send({
      from: 'Manga Collection <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Recuperação de senha',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="
            margin: 0;
            padding: 0;
            background: #030712;
            font-family: Arial, sans-serif;
            color: white;
          ">
            <div style="
              max-width: 600px;
              margin: 40px auto;
              background: #111827;
              border: 1px solid #374151;
              border-radius: 16px;
              padding: 40px;
            ">
              <h1 style="
                color: white;
                margin-top: 0;
              ">
                Recuperação de senha
              </h1>

              <p style="
                color: #9ca3af;
                font-size: 16px;
                line-height: 1.6;
              ">
                Olá${user.name ? `, ${user.name}` : ''}!
              </p>

              <p style="
                color: #9ca3af;
                font-size: 16px;
                line-height: 1.6;
              ">
                Recebemos uma solicitação para redefinir a senha da sua conta.
              </p>

              <div style="
                text-align: center;
                margin: 32px 0;
              ">
                <a
                  href="${resetUrl}"
                  style="
                    display: inline-block;
                    background: #9333ea;
                    color: white;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 8px;
                    font-weight: bold;
                  "
                >
                  Redefinir minha senha
                </a>
              </div>

              <p style="
                color: #9ca3af;
                font-size: 14px;
                line-height: 1.6;
              ">
                Este link expira em 1 hora.
              </p>

              <p style="
                color: #6b7280;
                font-size: 13px;
                line-height: 1.6;
              ">
                Se você não solicitou a recuperação da senha,
                ignore este e-mail.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error(
        'Erro ao enviar e-mail:',
        error
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível enviar o e-mail de recuperação.',
        },
        {
          status: 500,
        }
      )
    }

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