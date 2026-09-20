import { handle, json, readJson, clientIp } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { verifyAdminCode, verifyPassword } from '@/lib/password'
import { hit, limited } from '@/lib/rate-limit'
import { createSession } from '@/lib/session'
import { setSessionCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

const WINDOW = 15 * 60 * 1000

export const POST = handle(async (req) => {
  const data = await readJson(req, loginSchema)
  const ipKey = `login:ip:${clientIp(req)}`
  const userKey = `login:user:${data.username.toLowerCase()}`

  // Only failed attempts count towards the limits.
  if (limited(ipKey, 20, WINDOW) || limited(userKey, 8, WINDOW)) {
    throw new ApiError(429, 'Too many failed attempts. Please wait a few minutes and try again.')
  }

  const user = await prisma.user.findUnique({ where: { username: data.username } })
  const passwordOk = await verifyPassword(data.password, user?.passwordHash)
  const wantsAdmin = Boolean(data.adminCode?.trim())
  const adminOk = wantsAdmin ? await verifyAdminCode(data.adminCode!.trim()) : false

  if (!user || !passwordOk || user.disabled || (wantsAdmin && !adminOk)) {
    hit(ipKey, WINDOW)
    hit(userKey, WINDOW)
    // One generic message: never reveal which part was wrong.
    throw new ApiError(401, wantsAdmin ? 'Invalid username, password or admin code.' : 'Invalid username or password.')
  }

  const { token, expiresAt } = await createSession({
    userId: user.id,
    isAdmin: wantsAdmin && adminOk,
    userAgent: req.headers.get('user-agent'),
  })
  setSessionCookie(token, expiresAt)
  return json({ ok: true, isAdmin: wantsAdmin && adminOk })
})
