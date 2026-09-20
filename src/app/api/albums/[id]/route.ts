import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { deleteStoredImages } from '@/lib/storage'
import { albumSchema } from '@/lib/validation'

async function loadOwned(id: string) {
  const session = await apiUser()
  const album = await prisma.album.findUnique({ where: { id } })
  if (!album) throw new ApiError(404, 'Album not found.')
  if (album.creatorId !== session.user.id && !session.isAdmin) throw new ApiError(403, 'Only the album creator or an admin can change this album.')
  return album
}

export const PATCH = handle(async (req, { params }) => {
  const album = await loadOwned(params.id)
  const data = await readJson(req, albumSchema)
  await prisma.album.update({ where: { id: album.id }, data: { name: data.name, description: data.description } })
  return json({ ok: true })
})

export const DELETE = handle(async (_req, { params }) => {
  const album = await loadOwned(params.id)
  const photos = await prisma.photo.findMany({ where: { albumId: album.id }, select: { id: true } })
  await prisma.album.delete({ where: { id: album.id } }) // photo rows cascade
  await deleteStoredImages(photos.map((p) => p.id))
  return json({ ok: true })
})
