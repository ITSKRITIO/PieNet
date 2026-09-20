'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, Trash2, UserX } from 'lucide-react'
import { LocalTime } from '../LocalTime'
import { Modal } from '../Modal'
import { PresenceDot } from '../PresenceDot'
import { useConfirm } from '../Confirm'
import { useToast } from '../Toast'
import { api } from '@/lib/client'

export type AdminUserDTO = {
  id: string
  username: string
  disabled: boolean
  createdAt: string
  counts: { plans: number; photos: number; announcements: number; messages: number }
}

export function AdminUsers({ users, meId }: { users: AdminUserDTO[]; meId: string }) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [resetting, setResetting] = useState<AdminUserDTO | null>(null)
  const [busy, setBusy] = useState(false)

  async function toggleDisabled(u: AdminUserDTO) {
    const next = !u.disabled
    if (
      next &&
      !(await confirm({
        title: `Disable @${u.username}?`,
        message: 'They will be signed out immediately and cannot sign in again until you re-enable them. Their content stays.',
        confirmLabel: 'Disable account',
        danger: true,
      }))
    )
      return
    try {
      await api(`/api/admin/users/${u.id}`, { method: 'PATCH', body: { disabled: next } })
      toast.success(next ? `@${u.username} disabled.` : `@${u.username} re-enabled.`)
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function remove(u: AdminUserDTO) {
    if (
      !(await confirm({
        title: `Delete @${u.username}?`,
        message: 'This permanently removes their account along with their messages, plans, announcements, albums and photos.',
        confirmLabel: 'Delete account',
        danger: true,
      }))
    )
      return
    try {
      await api(`/api/admin/users/${u.id}`, { method: 'DELETE' })
      toast.success(`@${u.username} deleted.`)
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function resetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resetting) return
    const newPassword = String(new FormData(e.currentTarget).get('newPassword') ?? '')
    setBusy(true)
    try {
      await api(`/api/admin/users/${resetting.id}`, { method: 'PATCH', body: { newPassword } })
      toast.success(`Password set for @${resetting.username}. Share it with them privately.`)
      setResetting(null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Members and moderation actions</caption>
          <thead>
            <tr className="border-b border-fg/10 text-left text-xs text-muted">
              <th scope="col" className="px-5 py-3 font-medium">Member</th>
              <th scope="col" className="px-5 py-3 font-medium">Joined</th>
              <th scope="col" className="px-5 py-3 font-medium">Content</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-fg/5 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <PresenceDot userId={u.id} self={u.id === meId} />
                    <Link href={`/members/${u.username}`} className="font-medium hover:text-accent">
                      @{u.username}
                    </Link>
                    {u.id === meId && <span className="chip">You</span>}
                    {u.disabled && <span className="chip border-red-400/30 text-red-300">Disabled</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-muted">
                  <LocalTime iso={u.createdAt} format="date" />
                </td>
                <td className="px-5 py-3 text-xs text-muted">
                  {u.counts.messages} msgs · {u.counts.plans} plans · {u.counts.photos} photos · {u.counts.announcements} posts
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-0.5">
                    <button className="btn-icon" onClick={() => setResetting(u)} aria-label={`Set a new password for @${u.username}`}>
                      <KeyRound className="h-4 w-4" />
                    </button>
                    {u.id !== meId && (
                      <>
                        <button className="btn-icon" onClick={() => toggleDisabled(u)} aria-label={`${u.disabled ? 'Enable' : 'Disable'} @${u.username}`}>
                          <UserX className="h-4 w-4" />
                        </button>
                        <button className="btn-icon hover:text-red-300" onClick={() => remove(u)} aria-label={`Delete @${u.username}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(resetting)} onClose={() => setResetting(null)} title={`New password for @${resetting?.username ?? ''}`}>
        <form onSubmit={resetPassword} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="text" className="input" autoComplete="off" minLength={8} required autoFocus />
            <p className="hint">At least 8 characters. All of their sessions will be signed out.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setResetting(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>Set password</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
