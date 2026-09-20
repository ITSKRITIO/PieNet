import type { Metadata } from 'next'
import { AdminModeration } from '@/components/admin/AdminModeration'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Admin · Announcements' }

export default async function AdminAnnouncementsPage() {
  await requireAdmin()
  const rows = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { author: { select: { username: true } } },
  })
  return (
    <AdminModeration
      rows={rows.map((a) => ({
        id: a.id,
        primary: a.pinned ? `${a.title} (pinned)` : a.title,
        secondary: a.content,
        author: a.author.username,
        createdAt: a.createdAt.toISOString(),
        href: '/announcements',
      }))}
      endpoint={(id) => `/api/announcements/${id}`}
      itemLabel="announcement"
      emptyTitle="No announcements yet"
      emptyMessage="Anything posted to the announcements page shows up here."
      confirmMessage="This announcement will be removed for everyone."
    />
  )
}
