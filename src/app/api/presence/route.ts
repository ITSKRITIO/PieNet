import { handle, json } from '@/lib/api'
import { apiUser } from '@/lib/auth'
import { onlineUserIds } from '@/lib/realtime'

export const GET = handle(async () => {
  await apiUser()
  return json({ online: onlineUserIds() })
})
