'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2, Pencil, Trash2, Upload, X } from 'lucide-react'
import { EmptyState } from './PageHeader'
import { LocalTime } from './LocalTime'
import { AlbumForm } from './AlbumsView'
import { useConfirm } from './Confirm'
import { useToast } from './Toast'
import { api } from '@/lib/client'
import { formatBytes } from '@/lib/utils'

export type PhotoDTO = {
  id: string
  width: number
  height: number
  bytes: number
  createdAt: string
  uploader: { id: string; username: string }
}

export type AlbumDetailDTO = {
  id: string
  name: string
  description: string
  createdAt: string
  creator: { id: string; username: string }
}

function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
  onDelete,
  canDelete,
}: {
  photos: PhotoDTO[]
  index: number
  onClose: () => void
  onNavigate: (i: number) => void
  onDelete: (p: PhotoDTO) => void
  canDelete: (p: PhotoDTO) => boolean
}) {
  const photo = photos[index]
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNavigate((index + 1) % photos.length)
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + photos.length) % photos.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, photos.length, onNavigate])

  if (!photo) return null

  return (
    <dialog
      ref={ref}
      className="dialog fixed inset-0 h-full w-full"
      aria-label="Photo viewer"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="flex h-[100dvh] w-screen flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 truncate text-sm text-muted">
            @{photo.uploader.username} · <LocalTime iso={photo.createdAt} format="datetime" /> · {photo.width}×{photo.height} ·{' '}
            {formatBytes(photo.bytes)}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <a className="btn-icon" href={`/api/media/photos/${photo.id}.webp`} download aria-label="Download photo">
              <Download className="h-4 w-4" />
            </a>
            {canDelete(photo) && (
              <button className="btn-icon hover:text-red-300" onClick={() => onDelete(photo)} aria-label="Delete photo">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button className="btn-icon" onClick={onClose} aria-label="Close viewer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6" onClick={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/photos/${photo.id}.webp`}
            alt={`Photo by @${photo.uploader.username}`}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <>
              <button
                className="btn-icon absolute left-3 h-11 w-11 bg-bg/70 backdrop-blur"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate((index - 1 + photos.length) % photos.length)
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="btn-icon absolute right-3 h-11 w-11 bg-bg/70 backdrop-blur"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate((index + 1) % photos.length)
                }}
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}

export function AlbumDetail({
  album,
  photos,
  meId,
  isAdmin,
  maxUploadMb,
}: {
  album: AlbumDetailDTO
  photos: PhotoDTO[]
  meId: string
  isAdmin: boolean
  maxUploadMb: number
}) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [open, setOpen] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const canManageAlbum = album.creator.id === meId || isAdmin

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      const form = new FormData()
      for (const f of Array.from(files).slice(0, 10)) form.append('files', f)
      setUploading(true)
      try {
        const res = await fetch(`/api/albums/${album.id}/photos`, { method: 'POST', body: form, credentials: 'same-origin' })
        const data = await res.json().catch(() => null)
        if (!res.ok && !data?.uploaded) throw new Error(data?.error ?? data?.failed?.[0]?.error ?? 'Upload failed.')
        if (data.uploaded) toast.success(`${data.uploaded} ${data.uploaded === 1 ? 'photo' : 'photos'} added.`)
        for (const f of data.failed ?? []) toast.error(`${f.name}: ${f.error}`)
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ''
      }
    },
    [album.id, router, toast],
  )

  async function removePhoto(p: PhotoDTO) {
    if (!(await confirm({ title: 'Delete this photo?', message: 'It will be removed from the album permanently.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await api(`/api/photos/${p.id}`, { method: 'DELETE' })
      toast.success('Photo deleted.')
      setOpen(null)
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function removeAlbum() {
    if (
      !(await confirm({
        title: `Delete “${album.name}”?`,
        message: `This deletes the album and all ${photos.length} of its photos.`,
        confirmLabel: 'Delete album',
        danger: true,
      }))
    )
      return
    try {
      await api(`/api/albums/${album.id}`, { method: 'DELETE' })
      toast.success('Album deleted.')
      router.push('/memories')
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <>
      <Link href="/memories" className="mb-6 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg">
        <ChevronLeft className="h-4 w-4" aria-hidden /> All albums
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl">{album.name}</h1>
          {album.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{album.description}</p>}
          <p className="mt-2 text-xs text-muted">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · started by @{album.creator.username} ·{' '}
            <LocalTime iso={album.createdAt} format="date" />
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageAlbum && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={removeAlbum}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
              </button>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            id="photo-upload"
            onChange={(e) => upload(e.target.files)}
          />
          <label htmlFor="photo-upload" className="btn btn-primary cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
            {uploading ? 'Uploading…' : 'Add photos'}
          </label>
        </div>
      </div>
      <p className="-mt-4 mb-8 text-xs text-muted">JPG, PNG, WebP or GIF, up to {maxUploadMb} MB each. Photos are resized for the web on upload.</p>

      {photos.length === 0 ? (
        <EmptyState
          title="This album is empty"
          message="Add the first photos. They’ll stay here until someone deletes them."
          action={
            <label htmlFor="photo-upload" className="btn btn-primary cursor-pointer">
              <Upload className="h-4 w-4" aria-hidden /> Add photos
            </label>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                onClick={() => setOpen(i)}
                className="group block w-full overflow-hidden rounded-lg border border-fg/10 focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Open photo by @${p.uploader.username}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/thumbs/${p.id}.webp`}
                  alt={`Photo by @${p.uploader.username}`}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:opacity-90"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open !== null && photos[open] && (
        <Lightbox
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
          onNavigate={setOpen}
          onDelete={removePhoto}
          canDelete={(p) => p.uploader.id === meId || isAdmin}
        />
      )}
      {editing && <AlbumForm album={album} open onClose={() => setEditing(false)} />}
    </>
  )
}
