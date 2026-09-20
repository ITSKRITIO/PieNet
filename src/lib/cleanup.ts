import { prisma } from './db'
import { emitAll } from './realtime'
import { messageCutoff } from './messages'

/** Deletes chat messages older than 24h. Touches nothing else. */
export async function purgeExpiredMessages(): Promise<number> {
  const cutoff = messageCutoff()
  const { count } = await prisma.message.deleteMany({ where: { createdAt: { lt: cutoff } } })
  if (count > 0) emitAll('messages:purged', { before: cutoff.toISOString() })
  return count
}

export async function purgeExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  return count
}
