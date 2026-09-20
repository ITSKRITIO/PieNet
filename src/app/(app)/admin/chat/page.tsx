import type { Metadata } from 'next'
import { AdminModeration } from '@/components/admin/AdminModeration'
import { ClearChatButton } from '@/components/admin/ClearChatButton'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { messageCutoff } from '@/lib/messages'

export const metadata: Metadata = { title: 'Admin · Chat' }

export default async function AdminChatPage() {
  await requireAdmin()
  const where = { createdAt: { gte: messageCutoff() } }
  const [count, rows] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { user: { select: { username: true } } } }),
  ])
  return (
    <AdminModeration
      header={<ClearChatButton count={count} />}
      rows={rows.map((m) => ({ id: m.id, primary: m.content, author: m.user.username, createdAt: m.createdAt.toISOString() }))}
      endpoint={(id) => `/api/messages/${id}`}
      itemLabel="message"
      emptyTitle="No messages right now"
      emptyMessage="Chat messages appear here for as long as they live, which is 24 hours."
      confirmMessage="It will be removed for everyone immediately."
    />
  )
}
