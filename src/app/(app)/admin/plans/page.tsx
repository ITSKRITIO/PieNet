import type { Metadata } from 'next'
import { AdminModeration } from '@/components/admin/AdminModeration'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Admin · Plans' }

export default async function AdminPlansPage() {
  await requireAdmin()
  const rows = await prisma.plan.findMany({
    orderBy: { startsAt: 'desc' },
    take: 200,
    include: { creator: { select: { username: true } }, _count: { select: { participants: true } } },
  })
  return (
    <AdminModeration
      rows={rows.map((p) => ({
        id: p.id,
        primary: p.title,
        secondary: [p.location, `${p._count.participants} attending`, p.description].filter(Boolean).join(' · '),
        author: p.creator.username,
        createdAt: p.startsAt.toISOString(),
        href: '/plans',
      }))}
      endpoint={(id) => `/api/plans/${id}`}
      itemLabel="plan"
      emptyTitle="No plans yet"
      emptyMessage="Plans created by any member show up here for moderation."
      confirmMessage="The plan and its attendance list will be removed."
    />
  )
}
