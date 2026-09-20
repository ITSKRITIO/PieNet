'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eraser } from 'lucide-react'
import { useConfirm } from '../Confirm'
import { useToast } from '../Toast'
import { api } from '@/lib/client'

export function ClearChatButton({ count }: { count: number }) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)

  async function clear() {
    if (
      !(await confirm({
        title: 'Clear the whole chat?',
        message: `This deletes all ${count} messages for everyone right now, instead of waiting for them to expire.`,
        confirmLabel: 'Clear chat',
        danger: true,
      }))
    )
      return
    setBusy(true)
    try {
      const res = await api<{ deleted: number }>('/api/admin/messages', { method: 'DELETE' })
      toast.success(`${res.deleted} messages deleted.`)
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
      <div>
        <h2 className="text-sm font-medium">Chat moderation</h2>
        <p className="mt-1 text-sm text-muted">
          {count} {count === 1 ? 'message' : 'messages'} in the last 24 hours. Everything older is removed automatically.
        </p>
      </div>
      <button className="btn btn-danger btn-sm" onClick={clear} disabled={busy || count === 0}>
        <Eraser className="h-3.5 w-3.5" aria-hidden /> Clear all now
      </button>
    </div>
  )
}
