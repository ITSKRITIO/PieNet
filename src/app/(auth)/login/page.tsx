import type { Metadata } from 'next'
import { LoginForm } from '@/components/AuthForms'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold">Sign in</h1>
      <LoginForm />
    </>
  )
}
