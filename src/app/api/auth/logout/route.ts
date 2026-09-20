import { cookies } from 'next/headers'
import { handle, json } from '@/lib/api'
import { clearSessionCookie } from '@/lib/auth'
import { SESSION_COOKIE, destroySessionByToken } from '@/lib/session'

export const POST = handle(async () => {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (token) await destroySessionByToken(token)
  clearSessionCookie()
  return json({ ok: true })
})
