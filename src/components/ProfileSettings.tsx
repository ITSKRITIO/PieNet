'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Avatar } from './Avatar'
import { useToast } from './Toast'
import { api, ClientApiError } from '@/lib/client'

export function ProfileSettings({ user }: { user: { username: string; bio: string } }) {
  const router = useRouter()
  const toast = useToast()
  const [bio, setBio] = useState(user.bio)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setSavingProfile(true)
    setErrors({})
    try {
      await api('/api/me', { method: 'PATCH', body: { username: f.get('username'), bio: f.get('bio') } })
      toast.success('Profile updated.')
      router.refresh()
    } catch (err) {
      setErrors((err as ClientApiError).fields ?? {})
      toast.error((err as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    setSavingPassword(true)
    setErrors({})
    try {
      await api('/api/me/password', { method: 'POST', body: { currentPassword: f.get('currentPassword'), newPassword: f.get('newPassword') } })
      toast.success('Password changed. Other devices were signed out.')
      form.reset()
    } catch (err) {
      setErrors((err as ClientApiError).fields ?? {})
      toast.error((err as Error).message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card p-7">
        <div className="mb-6 flex items-center gap-4">
          <Avatar size={64} />
          <div>
            <h2 className="font-medium">Your avatar</h2>
            <p className="mt-1 text-sm text-muted">Everyone here shares the same mark. There’s nothing to upload.</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4 border-t border-fg/10 pt-6" noValidate>
          <div>
            <label className="label" htmlFor="username">Username</label>
            <div className="flex items-center gap-2">
              <span className="text-muted" aria-hidden>@</span>
              <input id="username" name="username" className="input" defaultValue={user.username} maxLength={24} required />
            </div>
            {errors.username && <p className="field-error">{errors.username}</p>}
            <p className="hint">Changing this updates your profile link. 3–24 letters, numbers or underscores.</p>
          </div>
          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              className="input"
              rows={4}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A line or two about you."
            />
            {errors.bio && <p className="field-error">{errors.bio}</p>}
            <p className="hint">{bio.length}/300</p>
          </div>
          <div className="flex justify-end">
            <button className="btn btn-primary" disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="card p-7">
        <h2 className="font-medium">Password</h2>
        <p className="mt-1 text-sm text-muted">Changing your password signs you out everywhere else.</p>
        <form onSubmit={savePassword} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="currentPassword">Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" className="input" autoComplete="current-password" required />
            {errors.currentPassword && <p className="field-error">{errors.currentPassword}</p>}
          </div>
          <div>
            <label className="label" htmlFor="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="password" className="input" autoComplete="new-password" required />
            {errors.newPassword && <p className="field-error">{errors.newPassword}</p>}
            <p className="hint">At least 8 characters.</p>
          </div>
          <div className="flex justify-end">
            <button className="btn btn-ghost" disabled={savingPassword}>
              {savingPassword && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Change password
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
