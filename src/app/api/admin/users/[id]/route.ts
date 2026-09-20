import { handle, json, readJson } from '@/lib/api'
import { apiAdmin } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { disconnectUser } from '@/lib/realtime'
import { destroyUserSessions } from '@/lib/session'
import { deleteStoredImages } from '@/lib/storage'
import { adminUserSchema } from '@/lib/validation'

export const PATCH = handle(async (req, { params }) => {
  const admin = await apiAdmin()
  const data = await readJson(req, adminUserSchema)
  if (params.id === admin.user.id && data.disabled) throw new ApiError(400, 'You cannot disable your own account.')
  await prisma.user.findUniqueOrThrow({ where: { id: params.id }, select: { id: true } })

  await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(data.disabled !== undefined ? { disabled: data.disabled } : {}),
      ...(data.newPassword ? { passwordHash: await hashPassword(data.newPassword) } : {}),
    },
  })
  if (data.disabled || data.newPassword) {
    await destroyUserSessions(params.id, params.id === admin.user.id ? admin.id : undefined)
    if (params.id !== admin.user.id) disconnectUser(params.id)
  }
  return json({ ok: true })
})

export const DELETE = handle(async (_req, { params }) => {
  const admin = await apiAdmin()
  if (params.id === admin.user.id) throw new ApiError(400, 'You cannot delete your own account.')
  const photos = await prisma.photo.findMany({
    where: { OR: [{ uploaderId: params.id }, { album: { creatorId: params.id } }] },
    select: { id: true },
  })
  await prisma.user.delete({ where: { id: params.id } }) // everything they own cascades
  await deleteStoredImages(photos.map((p) => p.id))
  disconnectUser(params.id)
  return json({ ok: true })
})
