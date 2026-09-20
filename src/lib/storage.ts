import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { env } from './env'
import { ApiError } from './errors'

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'gif']
export const FILE_ID_RE = /^[a-f0-9]{24}$/

export type StoredImage = { id: string; width: number; height: number; bytes: number }

const dir = (kind: 'photos' | 'thumbs') => path.join(env.storageDir, kind)

/** Resolves a stored file path and guarantees it stays inside the storage directory. */
export function resolveStoredFile(kind: 'photos' | 'thumbs', id: string) {
  if (!FILE_ID_RE.test(id)) return null
  const base = dir(kind)
  const full = path.resolve(base, `${id}.webp`)
  if (!full.startsWith(base + path.sep)) return null
  return full
}

/**
 * Validates the buffer is a real image, strips metadata, auto-rotates, then writes a
 * web-optimised full-size and thumbnail WebP. The original upload is never kept.
 */
export async function storeImage(input: Buffer): Promise<StoredImage> {
  let format: string | undefined
  try {
    format = (await sharp(input, { limitInputPixels: 60_000_000 }).metadata()).format
  } catch {
    throw new ApiError(415, 'That file is not a readable image.')
  }
  if (!format || !ALLOWED_FORMATS.includes(format)) throw new ApiError(415, 'Use a JPG, PNG, WebP or GIF image.')

  const id = crypto.randomBytes(12).toString('hex')
  const full = await sharp(input)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })
  const thumb = await sharp(input)
    .rotate()
    .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer()

  await Promise.all([fs.mkdir(dir('photos'), { recursive: true }), fs.mkdir(dir('thumbs'), { recursive: true })])
  await Promise.all([
    fs.writeFile(resolveStoredFile('photos', id)!, full.data),
    fs.writeFile(resolveStoredFile('thumbs', id)!, thumb),
  ])
  return { id, width: full.info.width, height: full.info.height, bytes: full.info.size }
}

export async function deleteStoredImages(ids: string[]) {
  await Promise.all(
    ids.flatMap((id) =>
      (['photos', 'thumbs'] as const).map(async (kind) => {
        const p = resolveStoredFile(kind, id)
        if (!p) return
        try {
          await fs.unlink(p)
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== 'ENOENT') console.error('Could not delete file', p, e)
        }
      }),
    ),
  )
}
