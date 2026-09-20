import { handle, json } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { hit, limited } from '@/lib/rate-limit'
import { ALLOWED_MIME, deleteStoredImages, storeImage } from '@/lib/storage'

export const runtime = 'nodejs'
const MAX_FILES = 10
const WINDOW = 10 * 60 * 1000

export const POST = handle(async (req, { params }) => {
  const session = await apiUser()
  const album = await prisma.album.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!album) throw new ApiError(404, 'Album not found.')

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    throw new ApiError(400, 'Could not read the upload.')
  }
  const files = form.getAll('files').filter((f): f is File => typeof f !== 'string')
  if (files.length === 0) throw new ApiError(400, 'Choose at least one photo.')
  if (files.length > MAX_FILES) throw new ApiError(400, `Upload up to ${MAX_FILES} photos at a time.`)

  const uploaded: string[] = []
  const failed: { name: string; error: string }[] = []

  for (const file of files) {
    const rlKey = `upload:${session.user.id}`
    if (limited(rlKey, 40, WINDOW)) {
      failed.push({ name: file.name, error: 'Upload limit reached. Try again in a few minutes.' })
      continue
    }
    hit(rlKey, WINDOW)
    try {
      if (!ALLOWED_MIME.includes(file.type)) throw new ApiError(415, 'Use a JPG, PNG, WebP or GIF image.')
      if (file.size > env.maxUploadBytes) throw new ApiError(413, `Larger than the ${Math.round(env.maxUploadBytes / 1048576)} MB limit.`)
      const stored = await storeImage(Buffer.from(await file.arrayBuffer()))
      try {
        await prisma.photo.create({ data: { ...stored, albumId: album.id, uploaderId: session.user.id } })
        uploaded.push(stored.id)
      } catch (e) {
        await deleteStoredImages([stored.id]) // don't leave orphaned files behind
        throw e
      }
    } catch (e) {
      failed.push({ name: file.name, error: e instanceof ApiError ? e.message : 'Could not process this image.' })
      if (!(e instanceof ApiError)) console.error('[upload]', e)
    }
  }
  return json({ uploaded: uploaded.length, failed }, uploaded.length ? 201 : 400)
})
