import path from 'node:path'

// Read lazily so scripts and the custom server can load .env before first use.
export const env = {
  get sessionSecret(): string {
    const s = process.env.SESSION_SECRET ?? ''
    if (s.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters (see .env.example).')
    return s
  },
  get sessionMs(): number {
    return (Number(process.env.SESSION_DAYS) || 7) * 24 * 60 * 60 * 1000
  },
  get adminCodeHash(): string | null {
    const b64 = process.env.ADMIN_CODE_HASH_B64
    return b64 ? Buffer.from(b64, 'base64').toString('utf8') : null
  },
  get inviteCode(): string | null {
    return process.env.INVITE_CODE || null
  },
  get storageDir(): string {
    return path.resolve(process.env.STORAGE_DIR || './storage')
  },
  get maxUploadBytes(): number {
    return (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024
  },
  get isProd(): boolean {
    return process.env.NODE_ENV === 'production'
  },
  get secureCookies(): boolean {
    const v = process.env.COOKIE_SECURE
    if (v === 'true') return true
    if (v === 'false') return false
    return process.env.NODE_ENV === 'production'
  },
  get trustProxy(): boolean {
    return process.env.TRUST_PROXY === 'true'
  },
}
