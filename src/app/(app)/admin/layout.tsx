import { Shield } from 'lucide-react'
import { AdminNav } from '@/components/admin/AdminNav'
import { requireAdmin } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div>
      <div className="mb-8 flex items-center gap-2.5">
        <Shield className="h-5 w-5 text-accent" aria-hidden />
        <h1 className="font-serif text-3xl">Admin</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[228px_1fr]">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
