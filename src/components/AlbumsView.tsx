'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FolderPlus, Images } from 'lucide-react'
import { EmptyState } from './PageHeader'
import { LocalTime } from './LocalTime'
import { Modal } from './Modal'
import { useToast } from './Toast'
import { api, ClientApiError } from '@/lib/client'

export type AlbumSummary = {
  id: string
  name: string
  description: string
  createdAt: string
  creator: { username: string }
  photoCount: number
  cover: string | null
}

export function AlbumForm({
  album,
  open,
  onClose,
}: {
  album?: { id: string; name: string; description: string }
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setErrors({})
    try {
      await api(album ? `/api/albums/${album.id}` : '/api/albums', {
        method: album ? 'PATCH' : 'POST',
        body: { name: f.get('name'), description: f.get('description') },
      })
      toast.success(album ? 'Album updated.' : 'Album created.')
      onClose()
      router.refresh()
    } catch (err) {
      setErrors((err as ClientApiError).fields ?? {})
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={album ? 'Edit album' : 'New album'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="al-name">Album name</label>
          <input id="al-name" name="name" className="input" defaultValue={album?.name} maxLength={80} required autoFocus />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="al-desc">Description</label>
          <textarea id="al-desc" name="description" className="input" rows={3} defaultValue={album?.description} maxLength={500} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{album ? 'Save changes' : 'Create album'}</button>
        </div>
      </form>
    </Modal>
  )
}

export function AlbumsView({ albums }: { albums: AlbumSummary[] }) {
  const [creating, setCreating] = useState(false)
  return (
    <>
      <div className="mb-8 flex justify-end">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <FolderPlus className="h-4 w-4" aria-hidden /> New album
        </button>
      </div>

      {albums.length === 0 ? (
        <EmptyState
          title="No albums yet"
          message="Start an album and add the photos worth keeping. Memories stay here for good."
          action={<button className="btn btn-primary" onClick={() => setCreating(true)}>Create the first album</button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <li key={a.id}>
              <Link href={`/memories/${a.id}`} className="card card-link block overflow-hidden">
                <div className="grid aspect-[4/3] place-items-center border-b border-fg/10 bg-fg/[0.02]">
                  {a.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/media/thumbs/${a.cover}.webp`} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Images className="h-8 w-8 text-fg/15" aria-hidden />
                  )}
                </div>
                <div className="p-5">
                  <h2 className="truncate font-medium">{a.name}</h2>
                  {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>}
                  <p className="mt-3 text-xs text-muted">
                    {a.photoCount} {a.photoCount === 1 ? 'photo' : 'photos'} · @{a.creator.username} ·{' '}
                    <LocalTime iso={a.createdAt} format="date" />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <AlbumForm open={creating} onClose={() => setCreating(false)} key={String(creating)} />
    </>
  )
}
