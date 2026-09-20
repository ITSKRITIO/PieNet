import type { Metadata } from 'next'
import { SiteSettingsEditor } from '@/components/admin/SiteSettingsEditor'
import { requireAdmin } from '@/lib/auth'
import { env } from '@/lib/env'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Admin · Settings' }

export default async function AdminSettingsPage() {
  await requireAdmin()
  const s = await getSettings()
  return (
    <SiteSettingsEditor
      initial={{ signupEnabled: s.signupEnabled, membersCanAnnounce: s.membersCanAnnounce }}
      inviteRequired={Boolean(env.inviteCode)}
      adminCodeConfigured={Boolean(env.adminCodeHash)}
    />
  )
}
