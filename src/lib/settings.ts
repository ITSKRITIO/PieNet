import { cache } from 'react'
import { prisma } from './db'
import { DEFAULT_SETTINGS } from './site-defaults'
import { settingsShape, type SiteSettings } from './validation'

export { DEFAULT_SETTINGS, hexToChannels } from './site-defaults'

/** Loads settings from the database, falling back to defaults for anything missing or invalid. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  try {
    const rows = await prisma.setting.findMany()
    for (const row of rows) {
      const schema = (settingsShape as unknown as Record<string, { safeParse: (v: unknown) => { success: boolean; data?: unknown } }>)[row.key]
      if (!schema) continue
      try {
        const parsed = schema.safeParse(JSON.parse(row.value))
        if (parsed.success) merged[row.key] = parsed.data
      } catch {
        /* ignore a corrupt row rather than breaking the whole site */
      }
    }
  } catch (e) {
    console.error('[pie] could not load settings, using defaults', e)
  }
  return merged as SiteSettings
})

export async function saveSettings(values: Partial<SiteSettings>) {
  const entries = Object.entries(values).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(value) },
        update: { value: JSON.stringify(value) },
      }),
    ),
  )
}
