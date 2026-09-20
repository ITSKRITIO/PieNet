import fs from 'node:fs/promises'
import { NextResponse } from 'next/server'
import { handle } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { resolveStoredFile } from '@/lib/storage'

export const runtime = 'nodejs'

// Photos are only served to signed-in members, and only from the storage directory.
export const GET = handle(async (_req, { params }) => {
  await apiUser()
  const kind = params.kind
  if (kind !== 'photos' && kind !== 'thumbs') throw new ApiError(404, 'Not found.')
  const match = /^([a-f0-9]{24})\.webp$/.exec(params.file)
  const full = match ? resolveStoredFile(kind, match[1]) : null
  if (!full) throw new ApiError(404, 'Not found.')
  let data: Buffer
  try {
    data = await fs.readFile(full)
  } catch {
    throw new ApiError(404, 'Not found.')
  }
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})
