import { handle, json } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { deleteStoredImages } from '@/lib/storage'

export const DELETE = handle(async (_req, { params }) => {
  const session = await apiUser()
  const photo = await prisma.photo.findUnique({ where: { id: params.id }, include: { album: { select: { creatorId: true } } } })
  if (!photo) throw new ApiError(404, 'Photo not found.')
  if (photo.uploaderId !== session.user.id && !session.isAdmin) throw new ApiError(403, 'Only the uploader or an admin can delete this photo.')
  await prisma.photo.delete({ where: { id: photo.id } })
  await deleteStoredImages([photo.id])
  return json({ ok: true })
})
