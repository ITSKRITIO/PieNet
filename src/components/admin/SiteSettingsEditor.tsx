'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '../Toast'
import { api } from '@/lib/client'
import type { SiteSettings } from '@/lib/validation'

export function SiteSettingsEditor({
  initial,
  inviteRequired,
  adminCodeConfigured,
}: {
  initial: Pick<SiteSettings, 'signupEnabled' | 'membersCanAnnounce'>
  inviteRequired: boolean
  adminCodeConfigured: boolean
}) {
  const router = useRouter()
  const toast = useToast()
  const [values, setValues] = useState(initial)
  const [busy, setBusy] = useState(false)

  async function update(patch: Partial<typeof values>) {
    const next = { ...values, ...patch }
    setValues(next)
    setBusy(true)
    try {
      await api('/api/admin/settings', { method: 'PUT', body: patch })
      toast.success('Setting saved.')
      router.refresh()
    } catch (e) {
      setValues(values)
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const Row = ({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between gap-6 border-b border-fg/5 py-5 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={checked}
          disabled={busy}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-fg/25 bg-fg/[0.06] accent-[rgb(var(--accent))]"
        />
        <span className="sr-only">{title}</span>
        {checked ? 'On' : 'Off'}
      </label>
    </div>
  )

  return (
    <div className="space-y-4">
      <section className="card px-6 py-1">
        <Row
          title="Open sign-ups"
          description={
            inviteRequired
              ? 'New people can create an account, but only with the invite code set in your .env file.'
              : 'Anyone who reaches the site can create an account. Set INVITE_CODE in .env to require a code.'
          }
          checked={values.signupEnabled}
          onChange={(v) => update({ signupEnabled: v })}
        />
        <Row
          title="Members can post announcements"
          description="When off, only administrators can post. Admins can always pin, edit and delete."
          checked={values.membersCanAnnounce}
          onChange={(v) => update({ membersCanAnnounce: v })}
        />
      </section>

      <section className="card p-6">
        <h2 className="font-medium">Administrator access</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Admin rights come from entering the admin code on the sign-in page, and they apply only to that session. The code lives
          in your <code className="rounded bg-fg/10 px-1 py-0.5 text-xs">.env</code> file as a bcrypt hash and is never sent to
          the browser. To change it, run <code className="rounded bg-fg/10 px-1 py-0.5 text-xs">npm run admin:hash</code>, paste
          the new line into <code className="rounded bg-fg/10 px-1 py-0.5 text-xs">.env</code> and restart the server.
        </p>
        <p className="mt-3 text-sm">
          {adminCodeConfigured ? (
            <span className="chip border-emerald-400/30 text-emerald-300">Admin code configured</span>
          ) : (
            <span className="chip border-red-400/30 text-red-300">No admin code set</span>
          )}
        </p>
        {busy && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Saving…
          </p>
        )}
      </section>
    </div>
  )
}
