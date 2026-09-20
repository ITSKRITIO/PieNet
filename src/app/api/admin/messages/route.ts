import { handle, json } from '@/lib/api'
import { apiAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { emitAll } from '@/lib/realtime'

// Clears the whole chat.
export const DELETE = handle(async () => {
  await apiAdmin()
  const { count } = await prisma.message.deleteMany({})
  emitAll('messages:purged', { before: new Date(Date.now() + 1000).toISOString() })
  return json({ deleted: count })
})
