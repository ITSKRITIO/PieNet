import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { announcementSchema } from '@/lib/validation'

export const POST = handle(async (req) => {
  const session = await apiUser()
  const settings = await getSettings()
  if (!session.isAdmin && !settings.membersCanAnnounce) throw new ApiError(403, 'Only administrators can post announcements.')
  const data = await readJson(req, announcementSchema)
  const item = await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      pinned: session.isAdmin ? Boolean(data.pinned) : false, // pinning is admin-only
      authorId: session.user.id,
    },
    select: { id: true },
  })
  return json({ announcement: item }, 201)
})
