import './globals.css'
import type { Metadata } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import { ToastProvider } from '@/components/Toast'
import { ConfirmProvider } from '@/components/Confirm'
import { getSettings, hexToChannels } from '@/lib/settings'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif', display: 'swap' })

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  return {
    title: { default: `${s.siteName} — ${s.slogan}`, template: `%s · ${s.siteName}` },
    description: s.slogan,
    robots: { index: false, follow: false },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings()
  // All values are validated hex colors, so this string is safe to inline.
  const vars = `:root{--bg:${hexToChannels(s.backgroundColor)};--fg:${hexToChannels(s.textColor)};--accent:${hexToChannels(s.accentColor)};--muted:${hexToChannels(s.mutedColor)}}`
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: vars }} />
      </head>
      <body>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
