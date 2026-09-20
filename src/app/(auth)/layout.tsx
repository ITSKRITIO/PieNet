import { redirect } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect('/')
  const s = await getSettings()
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <span aria-hidden className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 select-none font-serif text-[36rem] leading-none text-accent/[0.045]">
        {s.logoMark}
      </span>
      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo siteName={s.siteName} mark={s.logoMark} showMark={s.showLogo} size="lg" />
          <p className="mt-3 text-sm text-muted">{s.slogan}</p>
        </div>
        <div className="card p-7">{children}</div>
      </div>
    </main>
  )
}
