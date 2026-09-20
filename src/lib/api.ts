import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError, type ZodSchema } from 'zod'
import { ApiError } from './errors'
import { env } from './env'

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status })

type Ctx = { params: Record<string, string> }

/** Wraps a route handler with CSRF (same-origin) checks and uniform error responses. */
export function handle(fn: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ctx: any) => {
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertSameOrigin(req)
      return await fn(req, ctx)
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message, fields: e.fields }, e.status)
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {}
        for (const issue of e.issues) {
          const key = issue.path.join('.') || '_'
          fields[key] ??= issue.message
        }
        return json({ error: e.issues[0]?.message ?? 'Invalid input', fields }, 400)
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') return json({ error: 'That username is already taken.', fields: { username: 'Already taken' } }, 409)
        if (e.code === 'P2025') return json({ error: 'Not found.' }, 404)
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname}`, e)
      return json({ error: 'Something went wrong. Please try again.' }, 500)
    }
  }
}

function assertSameOrigin(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const origin = req.headers.get('origin')
  if (origin) {
    let originHost = ''
    try {
      originHost = new URL(origin).host
    } catch {
      /* fallthrough */
    }
    if (originHost && host && originHost === host) return
  } else {
    const site = req.headers.get('sec-fetch-site')
    if (site === 'same-origin' || site === 'none') return
  }
  throw new ApiError(403, 'Cross-site request blocked.')
}

export async function readJson<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new ApiError(400, 'Invalid request body.')
  }
  return schema.parse(raw)
}

export function clientIp(req: NextRequest) {
  if (env.trustProxy) {
    const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (fwd) return fwd
  }
  return 'direct'
}
