import type { Metadata } from 'next'
import { AdminUsers } from '@/components/admin/AdminUsers'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Admin · Users' }

export default async function AdminUsersPage() {
  const session = await requireAdmin()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { plans: true, photos: true, announcements: true, messages: true } } },
  })
  return (
    <AdminUsers
      meId={session.user.id}
      users={users.map((u) => ({
        id: u.id,
        username: u.username,
        disabled: u.disabled,
        createdAt: u.createdAt.toISOString(),
        counts: { plans: u._count.plans, photos: u._count.photos, announcements: u._count.announcements, messages: u._count.messages },
      }))}
    />
  )
}
