import { Header } from '@/components/Header'
import { RealtimeProvider } from '@/components/RealtimeProvider'
import { requireUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

const NAV = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'chat', href: '/chat', label: 'Global Chat' },
  { id: 'plans', href: '/plans', label: 'Plans' },
  { id: 'announcements', href: '/announcements', label: 'Announcements' },
  { id: 'memories', href: '/memories', label: 'Memories' },
  { id: 'members', href: '/members', label: 'Members' },
] as const

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser()
  const s = await getSettings()
  const items = NAV.filter((n) => s.nav[n.id]).map(({ href, label }) => ({ href, label }))
  return (
    <RealtimeProvider>
      <Header
        user={{ id: session.user.id, username: session.user.username }}
        isAdmin={session.isAdmin}
        brand={{ siteName: s.siteName, mark: s.logoMark, showLogo: s.showLogo }}
        items={items}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </RealtimeProvider>
  )
}
