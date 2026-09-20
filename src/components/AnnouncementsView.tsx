'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from './PageHeader'
import { LocalTime } from './LocalTime'
import { Modal } from './Modal'
import { useConfirm } from './Confirm'
import { useToast } from './Toast'
import { api, ClientApiError } from '@/lib/client'
import { cn } from '@/lib/utils'

export type AnnouncementDTO = {
  id: string
  title: string
  content: string
  pinned: boolean
  createdAt: string
  updatedAt: string
  author: { id: string; username: string }
}

function AnnouncementForm({ item, open, onClose, canPin }: { item?: AnnouncementDTO; open: boolean; onClose: () => void; canPin: boolean }) {
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
      await api(item ? `/api/announcements/${item.id}` : '/api/announcements', {
        method: item ? 'PATCH' : 'POST',
        body: {
          title: f.get('title'),
          content: f.get('content'),
          ...(canPin ? { pinned: f.get('pinned') === 'on' } : {}),
        },
      })
      toast.success(item ? 'Announcement updated.' : 'Announcement posted.')
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
    <Modal open={open} onClose={onClose} title={item ? 'Edit announcement' : 'New announcement'} wide>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="a-title">Title</label>
          <input id="a-title" name="title" className="input" defaultValue={item?.title} maxLength={140} required autoFocus />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div>
          <label className="label" htmlFor="a-content">Announcement</label>
          <textarea id="a-content" name="content" className="input" rows={7} defaultValue={item?.content} maxLength={5000} required />
          {errors.content && <p className="field-error">{errors.content}</p>}
        </div>
        {canPin && (
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="pinned" defaultChecked={item?.pinned} className="h-4 w-4 rounded border-fg/25 bg-fg/[0.06] accent-[rgb(var(--accent))]" />
            Keep this at the top
          </label>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{item ? 'Save changes' : 'Post announcement'}</button>
        </div>
      </form>
    </Modal>
  )
}

export function AnnouncementsView({
  items,
  meId,
  isAdmin,
  canPost,
}: {
  items: AnnouncementDTO[]
  meId: string
  isAdmin: boolean
  canPost: boolean
}) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AnnouncementDTO | null>(null)

  async function remove(item: AnnouncementDTO) {
    if (!(await confirm({ title: `Delete “${item.title}”?`, message: 'This can’t be undone.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await api(`/api/announcements/${item.id}`, { method: 'DELETE' })
      toast.success('Announcement deleted.')
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <>
      {canPost && (
        <div className="mb-8 flex justify-end">
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New announcement
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          message={canPost ? 'Post something the group should keep seeing. Unlike chat, announcements stay.' : 'Admins will post here when there’s something to share.'}
          action={canPost ? <button className="btn btn-primary" onClick={() => setCreating(true)}>Write the first one</button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <article key={a.id} className={cn('card p-6', a.pinned && 'border-accent/25')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {a.pinned && <Pin className="h-4 w-4 shrink-0 text-accent" aria-label="Pinned" />}
                    {a.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    <Link href={`/members/${a.author.username}`} className="hover:text-accent">@{a.author.username}</Link>
                    {' · '}
                    <LocalTime iso={a.createdAt} format="datetime" />
                    {a.updatedAt !== a.createdAt && ' · edited'}
                  </p>
                </div>
                {(a.author.id === meId || isAdmin) && (
                  <div className="flex shrink-0 gap-0.5">
                    <button className="btn-icon" onClick={() => setEditing(a)} aria-label={`Edit ${a.title}`}><Pencil className="h-4 w-4" /></button>
                    <button className="btn-icon hover:text-red-300" onClick={() => remove(a)} aria-label={`Delete ${a.title}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-fg/85">{a.content}</p>
            </article>
          ))}
        </div>
      )}

      <AnnouncementForm open={creating} onClose={() => setCreating(false)} canPin={isAdmin} key={String(creating)} />
      {editing && <AnnouncementForm item={editing} open onClose={() => setEditing(null)} canPin={isAdmin} />}
    </>
  )
}
