import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { env } from './env'

const COST = 12
let dummyHash: string | undefined

export function hashPassword(password: string) {
  return bcrypt.hash(password, COST)
}

/** Always performs a bcrypt comparison so unknown usernames take as long as known ones. */
export async function verifyPassword(password: string, hash: string | null | undefined) {
  const target = hash ?? (dummyHash ??= bcrypt.hashSync('pie-dummy-password', COST))
  const ok = await bcrypt.compare(password, target)
  return Boolean(hash) && ok
}

export async function verifyAdminCode(code: string) {
  const hash = env.adminCodeHash
  if (!hash) return false
  return bcrypt.compare(code, hash)
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}
