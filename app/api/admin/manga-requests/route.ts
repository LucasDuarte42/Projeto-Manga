import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forbiddenAdminResponse, requireAdminSession } from '@/lib/admin'

export async function GET() {
  const session = await requireAdminSession()
  if (!session) return forbiddenAdminResponse()

  const requests = await prisma.mangaRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(requests)
}
