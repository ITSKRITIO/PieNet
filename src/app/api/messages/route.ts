import { handle, json } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { messageCutoff, serializeMessage } from '@/lib/messages'

// History for the last 24h only, even if the cleanup job hasn't run yet.
export const GET = handle(async () => {
  await apiUser()
  const rows = await prisma.message.findMany({
    where: { createdAt: { gte: messageCutoff() } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { id: true, username: true } } },
  })
  return json({ messages: rows.reverse().map(serializeMessage) })
})
