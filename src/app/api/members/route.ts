import { handle, json } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const GET = handle(async (req) => {
  await apiUser()
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 24).replace(/^@/, '')
  const members = await prisma.user.findMany({
    where: { disabled: false, ...(q ? { username: { contains: q } } : {}) },
    orderBy: { username: 'asc' },
    take: 100,
    select: { id: true, username: true, bio: true, createdAt: true },
  })
  return json({ members: members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) })
})
