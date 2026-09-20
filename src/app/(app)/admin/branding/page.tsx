import type { Metadata } from 'next'
import { BrandingEditor } from '@/components/admin/BrandingEditor'
import { requireAdmin } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Admin · Branding' }

export default async function AdminBrandingPage() {
  await requireAdmin()
  return <BrandingEditor initial={await getSettings()} />
}
