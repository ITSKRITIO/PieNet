import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { ProfileSettings } from '@/components/ProfileSettings'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Your profile' }

export default async function SettingsPage() {
  const session = await requireUser()
  return (
    <>
      <PageHeader title="Your profile" subtitle="How you show up to everyone else here." />
      <ProfileSettings user={{ username: session.user.username, bio: session.user.bio }} />
    </>
  )
}
