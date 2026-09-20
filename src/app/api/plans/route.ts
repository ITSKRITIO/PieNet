import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { consume } from '@/lib/rate-limit'
import { planSchema } from '@/lib/validation'

export const POST = handle(async (req) => {
  const session = await apiUser()
  if (!consume(`plan:${session.user.id}`, 10, 60 * 60 * 1000)) throw new ApiError(429, 'You are creating plans too quickly.')
  const data = await readJson(req, planSchema)
  const plan = await prisma.plan.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      creatorId: session.user.id,
      participants: { create: { userId: session.user.id, status: 'GOING' } },
    },
    select: { id: true },
  })
  return json({ plan }, 201)
})
