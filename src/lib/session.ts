// Framework-agnostic session helpers (used by the Next.js app and the Socket.IO server).
import crypto from 'node:crypto'
import { prisma } from './db'
import { env } from './env'

export const SESSION_COOKIE = 'pie_session'

export type SessionUser = { id: string; username: string; bio: string; createdAt: Date }
export type ActiveSession = { id: string; isAdmin: boolean; expiresAt: Date; user: SessionUser }

// Only an HMAC of the token is stored, so a leaked database cannot be used to hijack sessions.
export function hashToken(token: string) {
  return crypto.createHmac('sha256', env.sessionSecret).update(token).digest('hex')
}

export async function createSession(opts: { userId: string; isAdmin: boolean; userAgent?: string | null }) {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + env.sessionMs)
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: opts.userId,
      isAdmin: opts.isAdmin,
      userAgent: opts.userAgent?.slice(0, 255) ?? null,
      expiresAt,
    },
  })
  return { token, expiresAt }
}

export async function getSessionByToken(token: string): Promise<ActiveSession | null> {
  if (!token || token.length > 200) return null
  const s = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, username: true, bio: true, createdAt: true, disabled: true } } },
  })
  if (!s || s.expiresAt <= new Date() || s.user.disabled) return null
  const { disabled: _d, ...user } = s.user
  return { id: s.id, isAdmin: s.isAdmin, expiresAt: s.expiresAt, user }
}

export async function destroySessionByToken(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
}

export async function destroyUserSessions(userId: string, exceptSessionId?: string) {
  await prisma.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { NOT: { id: exceptSessionId } } : {}) },
  })
}
