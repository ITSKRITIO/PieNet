import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { announcementSchema } from '@/lib/validation'
import { z } from 'zod'

async function loadOwned(id: string) {
  const session = await apiUser()
  const item = await prisma.announcement.findUnique({ where: { id } })
  if (!item) throw new ApiError(404, 'Announcement not found.')
  if (item.authorId !== session.user.id && !session.isAdmin) throw new ApiError(403, 'Only the author or an admin can change this.')
  return { item, session }
}

export const PATCH = handle(async (req, { params }) => {
  const { item, session } = await loadOwned(params.id)
  const data = await readJson(req, announcementSchema.partial().extend({ pinned: z.boolean().optional() }))
  await prisma.announcement.update({
    where: { id: item.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(session.isAdmin && data.pinned !== undefined ? { pinned: data.pinned } : {}),
    },
  })
  return json({ ok: true })
})

export const DELETE = handle(async (_req, { params }) => {
  const { item } = await loadOwned(params.id)
  await prisma.announcement.delete({ where: { id: item.id } })
  return json({ ok: true })
})
