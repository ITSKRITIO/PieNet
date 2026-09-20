import type { Metadata } from 'next'
import { SignupForm } from '@/components/AuthForms'
import { env } from '@/lib/env'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignupPage() {
  const s = await getSettings()
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold">Create your account</h1>
      <SignupForm inviteRequired={Boolean(env.inviteCode)} open={s.signupEnabled} />
    </>
  )
}
