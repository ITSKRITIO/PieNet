import { handle, json } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { emitAll } from '@/lib/realtime'

export const DELETE = handle(async (_req, { params }) => {
  const session = await apiUser()
  const message = await prisma.message.findUnique({ where: { id: params.id } })
  if (!message) throw new ApiError(404, 'Message not found.')
  if (message.userId !== session.user.id && !session.isAdmin) throw new ApiError(403, 'You can only delete your own messages.')
  await prisma.message.delete({ where: { id: message.id } })
  emitAll('message:deleted', { id: message.id })
  return json({ ok: true })
})
