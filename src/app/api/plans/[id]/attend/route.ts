import { handle, json, readJson } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { attendSchema } from '@/lib/validation'

export const POST = handle(async (req, { params }) => {
  const session = await apiUser()
  const { status } = await readJson(req, attendSchema)
  if (!(await prisma.plan.findUnique({ where: { id: params.id }, select: { id: true } }))) throw new ApiError(404, 'Plan not found.')
  const key = { planId_userId: { planId: params.id, userId: session.user.id } }
  if (status === null) {
    await prisma.planParticipant.deleteMany({ where: { planId: params.id, userId: session.user.id } })
  } else {
    await prisma.planParticipant.upsert({
      where: key,
      create: { planId: params.id, userId: session.user.id, status },
      update: { status },
    })
  }
  return json({ ok: true })
})
