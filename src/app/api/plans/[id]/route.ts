import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { planSchema } from '@/lib/validation'

async function loadOwned(id: string) {
  const session = await apiUser()
  const plan = await prisma.plan.findUnique({ where: { id } })
  if (!plan) throw new ApiError(404, 'Plan not found.')
  if (plan.creatorId !== session.user.id && !session.isAdmin) throw new ApiError(403, 'Only the creator or an admin can change this plan.')
  return plan
}

export const PATCH = handle(async (req, { params }) => {
  const plan = await loadOwned(params.id)
  const data = await readJson(req, planSchema)
  await prisma.plan.update({
    where: { id: plan.id },
    data: { title: data.title, description: data.description, location: data.location, startsAt: data.startsAt, endsAt: data.endsAt ?? null },
  })
  return json({ ok: true })
})

export const DELETE = handle(async (_req, { params }) => {
  const plan = await loadOwned(params.id)
  await prisma.plan.delete({ where: { id: plan.id } })
  return json({ ok: true })
})
