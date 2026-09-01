import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forbiddenAdminResponse, requireAdminSession } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const session = await requireAdminSession()
  if (!session) return forbiddenAdminResponse()

  const q = req.nextUrl.searchParams.get('q')?.trim() || ''

  const entries = await prisma.catalogManga.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' },
    take: 50,
    include: { _count: { select: { mangas: true } } },
  })

  return NextResponse.json(entries)
}
