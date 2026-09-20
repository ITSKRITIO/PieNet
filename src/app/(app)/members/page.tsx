import type { Metadata } from 'next'
import { MembersView } from '@/components/MembersView'
import { PageHeader } from '@/components/PageHeader'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Members' }

export default async function MembersPage() {
  const session = await requireUser()
  const members = await prisma.user.findMany({
    where: { disabled: false },
    orderBy: { username: 'asc' },
    select: { id: true, username: true, bio: true, createdAt: true },
  })
  return (
    <>
      <PageHeader title="Members" subtitle="Everyone with a key to this place." />
      <MembersView initial={members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} meId={session.user.id} />
    </>
  )
}
