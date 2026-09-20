// Client-safe: no database imports, so components can use these without pulling in Prisma.
import type { SiteSettings } from './validation'

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'PIE',
  slogan: 'Made to be connected.',
  showLogo: true,
  logoMark: 'π',
  accentColor: '#38bdf8',
  backgroundColor: '#05070d',
  textColor: '#f5f8ff',
  mutedColor: '#93a4bd',
  nav: { home: true, chat: true, plans: true, announcements: true, memories: true, members: true },
  homeSections: { chat: true, plans: true, announcements: true, memories: true },
  signupEnabled: true,
  membersCanAnnounce: true,
}

export function hexToChannels(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
