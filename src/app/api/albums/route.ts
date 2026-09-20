import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { albumSchema } from '@/lib/validation'

export const POST = handle(async (req) => {
  const session = await apiUser()
  const data = await readJson(req, albumSchema)
  const album = await prisma.album.create({
    data: { name: data.name, description: data.description, creatorId: session.user.id },
    select: { id: true },
  })
  return json({ album }, 201)
})
