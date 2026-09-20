'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, Images, Megaphone, MessageCircle, Palette, SlidersHorizontal, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/chat', label: 'Chat', icon: MessageCircle },
  { href: '/admin/plans', label: 'Plans', icon: CalendarDays },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/memories', label: 'Memories', icon: Images },
  { href: '/admin/branding', label: 'Branding & appearance', icon: Palette },
  { href: '/admin/settings', label: 'Settings', icon: SlidersHorizontal },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin sections" className="lg:sticky lg:top-24">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition',
                  active ? 'bg-fg/[0.08] text-fg' : 'text-muted hover:bg-fg/[0.04] hover:text-fg',
                )}
              >
                <Icon className={cn('h-4 w-4', active && 'text-accent')} aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
