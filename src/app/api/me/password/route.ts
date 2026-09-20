import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { consume } from '@/lib/rate-limit'
import { destroyUserSessions } from '@/lib/session'
import { passwordChangeSchema } from '@/lib/validation'

export const POST = handle(async (req) => {
  const session = await apiUser()
  if (!consume(`pwchange:${session.user.id}`, 5, 15 * 60 * 1000)) throw new ApiError(429, 'Too many attempts. Try again later.')
  const data = await readJson(req, passwordChangeSchema)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } })
  if (!(await verifyPassword(data.currentPassword, user.passwordHash))) {
    throw new ApiError(400, 'Your current password is incorrect.', { currentPassword: 'Incorrect password' })
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.newPassword) } })
  await destroyUserSessions(user.id, session.id) // sign out every other device
  return json({ ok: true })
})
