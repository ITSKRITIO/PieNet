import { prisma } from '@/lib/prisma';
import { handle, json, readJson, clientIp } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { hashPassword, safeEqual } from '@/lib/password'
import { consume } from '@/lib/rate-limit'
import { createSession } from '@/lib/session'
import { getSettings } from '@/lib/settings'
import { setSessionCookie } from '@/lib/auth'
import { signupSchema } from '@/lib/validation'

export const POST = handle(async (req) => {
  const settings = await getSettings()
  if (!settings.signupEnabled) throw new ApiError(403, 'Sign-ups are currently closed.')
  if (!consume(`signup:${clientIp(req)}`, 8, 60 * 60 * 1000)) {
    throw new ApiError(429, 'Too many sign-up attempts. Try again in a while.')
  }
  const data = await readJson(req, signupSchema)

  const invite = env.inviteCode
  if (invite && !safeEqual(data.inviteCode ?? '', invite)) {
    throw new ApiError(403, 'That invite code is not valid.', { inviteCode: 'Invalid invite code' })
  }

  const user = await prisma.user.create({
    data: { username: data.username, passwordHash: await hashPassword(data.password) },
    select: { id: true },
  })
  const { token, expiresAt } = await createSession({ userId: user.id, isAdmin: false, userAgent: req.headers.get('user-agent') })
  setSessionCookie(token, expiresAt)
  return json({ ok: true })
})
