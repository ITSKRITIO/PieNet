import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { prisma } from '../lib/db'
import { getSessionByToken, SESSION_COOKIE } from '../lib/session'
import { realtime, onlineUserIds } from '../lib/realtime'
import { consume } from '../lib/rate-limit'
import { chatMessageSchema } from '../lib/validation'
import { serializeMessage } from '../lib/messages'

function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) {
      try {
        return decodeURIComponent(rest.join('='))
      } catch {
        return undefined
      }
    }
  }
  return undefined
}

type Ack = (res: { ok: boolean; error?: string }) => void

export function attachRealtime(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    serveClient: false,
    destroyUpgrade: false,
    maxHttpBufferSize: 10_000,
    // Block cross-site WebSocket hijacking: the Origin must match the Host.
    allowRequest: (req, cb) => {
      const origin = req.headers.origin
      const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host
      if (!origin) return cb(null, true)
      try {
        cb(null, new URL(origin).host === host)
      } catch {
        cb(null, false)
      }
    },
  })
  realtime.io = io

  // Every connection must carry a valid session cookie.
  io.use(async (socket, nextFn) => {
    try {
      const token = readCookie(socket.request.headers.cookie, SESSION_COOKIE)
      const session = token ? await getSessionByToken(token) : null
      if (!token || !session) return nextFn(new Error('unauthorized'))
      socket.data.token = token
      socket.data.user = session.user
      nextFn()
    } catch {
      nextFn(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; username: string }
    socket.join(`user:${user.id}`)

    const set = realtime.sockets.get(user.id) ?? new Set<string>()
    const wasOffline = set.size === 0
    set.add(socket.id)
    realtime.sockets.set(user.id, set)
    if (wasOffline) io.emit('presence:update', { userId: user.id, online: true })
    socket.emit('presence:list', onlineUserIds())

    socket.on('message:send', async (raw: unknown, ack?: Ack) => {
      const reply: Ack = typeof ack === 'function' ? ack : () => undefined
      try {
        const session = await getSessionByToken(socket.data.token)
        if (!session) {
          reply({ ok: false, error: 'Your session has expired. Please sign in again.' })
          socket.disconnect(true)
          return
        }
        if (!consume(`chat:${user.id}`, 6, 10_000)) {
          return reply({ ok: false, error: 'You are sending messages too quickly. Wait a moment.' })
        }
        const parsed = chatMessageSchema.safeParse(raw)
        if (!parsed.success) return reply({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid message' })

        const message = await prisma.message.create({
          data: { userId: user.id, content: parsed.data.content },
          include: { user: { select: { id: true, username: true } } },
        })
        io.emit('message:new', serializeMessage(message))
        reply({ ok: true })
      } catch (e) {
        console.error('[socket] message:send failed', e)
        reply({ ok: false, error: 'Could not send your message. Try again.' })
      }
    })

    socket.on('disconnect', () => {
      set.delete(socket.id)
      if (set.size > 0) return
      // Short grace period so page reloads don't flicker the user offline.
      setTimeout(() => {
        const current = realtime.sockets.get(user.id)
        if (current && current.size === 0) {
          realtime.sockets.delete(user.id)
          io.emit('presence:update', { userId: user.id, online: false })
          prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined)
        }
      }, 4000).unref()
    })
  })

  return io
}
