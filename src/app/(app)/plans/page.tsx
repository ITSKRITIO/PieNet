import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { PlansView } from '@/components/PlansView'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Plans' }

export default async function PlansPage() {
  const session = await requireUser()
  const rows = await prisma.plan.findMany({
    orderBy: { startsAt: 'asc' },
    take: 300,
    include: {
      creator: { select: { id: true, username: true } },
      participants: { include: { user: { select: { username: true } } }, orderBy: { createdAt: 'asc' } },
    },
  })
  const plans = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    location: p.location,
    startsAt: p.startsAt.toISOString(),
    endsAt: p.endsAt?.toISOString() ?? null,
    creator: p.creator,
    participants: p.participants.map((x) => ({ userId: x.userId, username: x.user.username, status: x.status })),
  }))
  return (
    <>
      <PageHeader title="Plans" subtitle="What the group is up to. Add something, or tell everyone you’re in." />
      <PlansView plans={plans} meId={session.user.id} isAdmin={session.isAdmin} serverNow={Date.now()} />
    </>
  )
}
