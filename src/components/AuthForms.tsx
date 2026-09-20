'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from './Toast'
import { api, ClientApiError } from '@/lib/client'

function Field({ label, error, children, id }: { label: string; error?: string; children: React.ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function LoginForm() {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setErrors({})
    try {
      const res = await api<{ isAdmin: boolean }>('/api/auth/login', {
        method: 'POST',
        body: {
          username: f.get('username'),
          password: f.get('password'),
          adminCode: showAdmin ? f.get('adminCode') || undefined : undefined,
        },
      })
      toast.success(res.isAdmin ? 'Signed in as administrator.' : 'Welcome back.')
      router.replace('/')
      router.refresh()
    } catch (err) {
      const e2 = err as ClientApiError
      setErrors(e2.fields ?? {})
      toast.error(e2.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="username" label="Username" error={errors.username}>
        <input id="username" name="username" className="input" autoComplete="username" autoFocus required aria-describedby={errors.username ? 'username-error' : undefined} />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </Field>
      {showAdmin ? (
        <Field id="adminCode" label="Admin code (optional)">
          <input id="adminCode" name="adminCode" type="password" className="input" autoComplete="off" />
          <p className="hint">Only administrators need this. Leave it empty to sign in as a member.</p>
        </Field>
      ) : (
        <button type="button" className="text-[13px] text-muted transition hover:text-fg" onClick={() => setShowAdmin(true)}>
          I have an admin code
        </button>
      )}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Sign in
      </button>
      <p className="pt-1 text-center text-sm text-muted">
        New here?{' '}
        <Link href="/signup" className="link">
          Create an account
        </Link>
      </p>
    </form>
  )
}

export function SignupForm({ inviteRequired, open }: { inviteRequired: boolean; open: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!open) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">Sign-ups are closed right now. Ask an admin to open them or to create your account.</p>
        <Link href="/login" className="btn btn-ghost w-full">
          Back to sign in
        </Link>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setErrors({})
    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: {
          username: f.get('username'),
          password: f.get('password'),
          confirmPassword: f.get('confirmPassword'),
          inviteCode: f.get('inviteCode') || undefined,
        },
      })
      toast.success('Account created. Welcome!')
      router.replace('/')
      router.refresh()
    } catch (err) {
      const e2 = err as ClientApiError
      setErrors(e2.fields ?? {})
      toast.error(e2.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="username" label="Username" error={errors.username}>
        <input id="username" name="username" className="input" autoComplete="username" autoFocus required />
        <p className="hint">3–24 letters, numbers or underscores.</p>
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" required />
        <p className="hint">At least 8 characters.</p>
      </Field>
      <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
        <input id="confirmPassword" name="confirmPassword" type="password" className="input" autoComplete="new-password" required />
      </Field>
      {inviteRequired && (
        <Field id="inviteCode" label="Invite code" error={errors.inviteCode}>
          <input id="inviteCode" name="inviteCode" type="password" className="input" autoComplete="off" required />
        </Field>
      )}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Create account
      </button>
      <p className="pt-1 text-center text-sm text-muted">
        Already a member?{' '}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </form>
  )
}
