import { cache } from 'react'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ApiError } from './errors'
import { env } from './env'
import { SESSION_COOKIE, getSessionByToken, type ActiveSession } from './session'

export const getSession = cache(async (): Promise<ActiveSession | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value
  return token ? getSessionByToken(token) : null
})

/** For server components/pages: redirects to /login when signed out. */
export async function requireUser() {
  const s = await getSession()
  if (!s) redirect('/login')
  return s
}

/** For admin pages: non-admins get a 404 so the area's existence isn't revealed. */
export async function requireAdmin() {
  const s = await requireUser()
  if (!s.isAdmin) notFound()
  return s
}

/** For API routes: throws 401. */
export async function apiUser() {
  const s = await getSession()
  if (!s) throw new ApiError(401, 'Please sign in to continue.')
  return s
}

/** For API routes: throws 403 unless this session was authenticated with the admin code. */
export async function apiAdmin() {
  const s = await apiUser()
  if (!s.isAdmin) throw new ApiError(403, 'Administrator access required.')
  return s
}

export function setSessionCookie(token: string, expires: Date) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.secureCookies,
    path: '/',
    expires,
  })
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: env.secureCookies, path: '/', maxAge: 0 })
}
