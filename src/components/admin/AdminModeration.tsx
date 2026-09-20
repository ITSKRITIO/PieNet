'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { EmptyState } from '../PageHeader'
import { LocalTime } from '../LocalTime'
import { useConfirm } from '../Confirm'
import { useToast } from '../Toast'
import { api } from '@/lib/client'

export type ModerationRow = {
  id: string
  primary: string
  secondary?: string
  author: string
  createdAt: string
  href?: string
}

/** Shared moderation list used by the chat, plans, announcements and memories admin pages. */
export function AdminModeration({
  rows,
  endpoint,
  itemLabel,
  emptyTitle,
  emptyMessage,
  confirmMessage,
  header,
}: {
  rows: ModerationRow[]
  endpoint: (id: string) => string
  itemLabel: string
  emptyTitle: string
  emptyMessage: string
  confirmMessage: string
  header?: React.ReactNode
}) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState<string | null>(null)

  async function remove(row: ModerationRow) {
    if (!(await confirm({ title: `Delete this ${itemLabel}?`, message: confirmMessage, confirmLabel: 'Delete', danger: true }))) return
    setBusy(row.id)
    try {
      await api(endpoint(row.id), { method: 'DELETE' })
      toast.success(`${itemLabel[0].toUpperCase()}${itemLabel.slice(1)} deleted.`)
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      {header}
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <ul className="card divide-y divide-fg/5">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm">
                  {row.href ? (
                    <Link href={row.href} className="hover:text-accent">
                      {row.primary}
                    </Link>
                  ) : (
                    row.primary
                  )}
                </p>
                {row.secondary && <p className="mt-0.5 line-clamp-2 break-words text-sm text-muted">{row.secondary}</p>}
                <p className="mt-1.5 text-xs text-muted">
                  <Link href={`/members/${row.author}`} className="hover:text-accent">
                    @{row.author}
                  </Link>
                  {' · '}
                  <LocalTime iso={row.createdAt} format="datetime" />
                </p>
              </div>
              <button
                className="btn-icon shrink-0 hover:text-red-300"
                onClick={() => remove(row)}
                disabled={busy === row.id}
                aria-label={`Delete ${itemLabel} by @${row.author}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
