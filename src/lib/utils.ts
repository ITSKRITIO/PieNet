import clsx, { type ClassValue } from 'clsx'

export const cn = (...v: ClassValue[]) => clsx(v)

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export type PlanPhase = 'ongoing' | 'upcoming' | 'past'
export const DEFAULT_PLAN_MS = 2 * 60 * 60 * 1000

export function planPhase(startsAt: string | Date, endsAt: string | Date | null, now = Date.now()): PlanPhase {
  const start = new Date(startsAt).getTime()
  const end = endsAt ? new Date(endsAt).getTime() : start + DEFAULT_PLAN_MS
  if (now < start) return 'upcoming'
  if (now <= end) return 'ongoing'
  return 'past'
}
