import type { Metadata } from 'next'
import { ChatView } from '@/components/ChatView'
import { PageHeader } from '@/components/PageHeader'
import { OnlineCount } from '@/components/PresenceDot'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { messageCutoff, serializeMessage } from '@/lib/messages'

export const metadata: Metadata = { title: 'Global Chat' }

export default async function ChatPage() {
  const session = await requireUser()
  const rows = await prisma.message.findMany({
    where: { createdAt: { gte: messageCutoff() } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { id: true, username: true } } },
  })
  return (
    <>
      <PageHeader title="Global Chat" subtitle={<OnlineCount />} />
      <ChatView initial={rows.reverse().map(serializeMessage)} meId={session.user.id} isAdmin={session.isAdmin} />
    </>
  )
}
