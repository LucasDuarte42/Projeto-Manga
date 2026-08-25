import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const result = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  return NextResponse.json({ deleted: result.count })
}
