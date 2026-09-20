import { handle, json, readJson } from '@/lib/api'
import { apiAdmin } from '@/lib/auth'
import { getSettings, saveSettings } from '@/lib/settings'
import { settingsUpdateSchema } from '@/lib/validation'

export const GET = handle(async () => {
  await apiAdmin()
  return json({ settings: await getSettings() })
})

export const PUT = handle(async (req) => {
  await apiAdmin()
  const values = await readJson(req, settingsUpdateSchema)
  await saveSettings(values)
  return json({ ok: true })
})
