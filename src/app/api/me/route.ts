import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { profileSchema } from '@/lib/validation'

// Updates the signed-in user's existing row. Only ever touches the caller's own record.
export const PATCH = handle(async (req) => {
  const session = await apiUser()
  const data = await readJson(req, profileSchema)
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.username !== undefined ? { username: data.username } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
    },
    select: { id: true, username: true, bio: true },
  })
  return json({ user })
})
