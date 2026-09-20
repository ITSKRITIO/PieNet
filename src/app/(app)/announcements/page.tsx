import type { Metadata } from 'next'
import { AnnouncementsView } from '@/components/AnnouncementsView'
import { PageHeader } from '@/components/PageHeader'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Announcements' }

export default async function AnnouncementsPage() {
  const session = await requireUser()
  const s = await getSettings()
  const rows = await prisma.announcement.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    include: { author: { select: { id: true, username: true } } },
  })
  return (
    <>
      <PageHeader title="Announcements" subtitle="The things worth keeping. These stay until someone removes them." />
      <AnnouncementsView
        items={rows.map((a) => ({ ...a, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString() }))}
        meId={session.user.id}
        isAdmin={session.isAdmin}
        canPost={session.isAdmin || s.membersCanAnnounce}
      />
    </>
  )
}
