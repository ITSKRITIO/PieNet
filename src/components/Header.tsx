'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Menu, Settings, Shield, User, X } from 'lucide-react'
import { Logo } from './Logo'
import { PresenceDot } from './PresenceDot'
import { useToast } from './Toast'
import { api } from '@/lib/client'
import { cn } from '@/lib/utils'

type Props = {
  user: { id: string; username: string }
  isAdmin: boolean
  brand: { siteName: string; mark: string; showLogo: boolean }
  items: { href: string; label: string }[]
}

export function Header({ user, isAdmin, brand, items }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  async function signOut() {
    try {
      await api('/api/auth/logout', { method: 'POST' })
      router.replace('/login')
      router.refresh()
    } catch {
      toast.error('Could not sign out. Try again.')
    }
  }

  const itemClass = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-fg/90 transition hover:bg-fg/[0.07] focus-visible:bg-fg/[0.07]'

  return (
    <header className="sticky top-0 z-40 border-b border-fg/10 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo siteName={brand.siteName} mark={brand.mark} showMark={brand.showLogo} />

        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active(i.href) ? 'page' : undefined}
              className={cn(
                'relative rounded-md px-3 py-2 text-sm transition-colors',
                active(i.href) ? 'text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {i.label}
              {active(i.href) && <span className="absolute inset-x-3 -bottom-[13px] h-px bg-accent" />}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-10 items-center gap-2.5 rounded-lg border border-fg/10 bg-fg/[0.04] pl-3 pr-2.5 text-sm transition hover:border-fg/25"
            >
              <PresenceDot userId={user.id} self />
              <span className="max-w-[9rem] truncate">@{user.username}</span>
              <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', menuOpen && 'rotate-180')} aria-hidden />
            </button>
            {menuOpen && (
              <div role="menu" className="panel absolute right-0 mt-2 w-56 p-1.5">
                <Link role="menuitem" href={`/members/${user.username}`} className={itemClass}>
                  <User className="h-4 w-4 text-muted" aria-hidden /> View profile
                </Link>
                <Link role="menuitem" href="/settings" className={itemClass}>
                  <Settings className="h-4 w-4 text-muted" aria-hidden /> Edit profile
                </Link>
                {isAdmin && (
                  <Link role="menuitem" href="/admin" className={itemClass}>
                    <Shield className="h-4 w-4 text-accent" aria-hidden /> Admin dashboard
                  </Link>
                )}
                <div className="my-1.5 h-px bg-fg/10" />
                <button role="menuitem" onClick={signOut} className={itemClass}>
                  <LogOut className="h-4 w-4 text-muted" aria-hidden /> Sign out
                </button>
              </div>
            )}
          </div>

          <button
            className="btn-icon h-10 w-10 border border-fg/10 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-fg/10 px-4 py-3 md:hidden">
          <ul className="grid gap-1">
            {items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={active(i.href) ? 'page' : undefined}
                  className={cn('block rounded-md px-3 py-2.5 text-sm', active(i.href) ? 'bg-fg/[0.07] text-fg' : 'text-muted hover:text-fg')}
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
