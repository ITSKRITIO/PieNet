// State shared between the custom server (Socket.IO) and Next.js route handlers.
// Stored on globalThis because the two may load separate copies of this module.
import type { Server } from 'socket.io'

type RealtimeState = { io: Server | null; sockets: Map<string, Set<string>> }
const g = globalThis as unknown as { __pieRealtime?: RealtimeState }

export const realtime: RealtimeState = (g.__pieRealtime ??= { io: null, sockets: new Map() })

export function onlineUserIds(): string[] {
  return [...realtime.sockets.keys()]
}

export function emitAll(event: string, payload: unknown) {
  realtime.io?.emit(event, payload)
}

export function disconnectUser(userId: string) {
  realtime.io?.in(`user:${userId}`).disconnectSockets(true)
}
