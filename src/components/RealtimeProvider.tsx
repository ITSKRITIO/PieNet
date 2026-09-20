'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

type Status = 'connecting' | 'connected' | 'disconnected'
type Value = { socket: Socket | null; status: Status; online: Set<string> }

const Ctx = createContext<Value>({ socket: null, status: 'connecting', online: new Set() })
export const useRealtime = () => useContext(Ctx)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [status, setStatus] = useState<Status>('connecting')
  const [online, setOnline] = useState<Set<string>>(new Set())

  useEffect(() => {
    const s = io({ path: '/socket.io', reconnectionDelayMax: 5000 })
    setSocket(s)
    const toLogin = () => window.location.assign('/login')

    s.on('connect', () => setStatus('connected'))
    s.on('disconnect', (reason) => {
      setStatus('disconnected')
      if (reason === 'io server disconnect') toLogin() // session ended or account changed
    })
    s.on('connect_error', (err) => {
      setStatus('disconnected')
      if (err.message === 'unauthorized') toLogin()
    })
    s.on('presence:list', (ids: string[]) => setOnline(new Set(ids)))
    s.on('presence:update', ({ userId, online: on }: { userId: string; online: boolean }) =>
      setOnline((prev) => {
        const next = new Set(prev)
        if (on) next.add(userId)
        else next.delete(userId)
        return next
      }),
    )
    return () => {
      s.disconnect()
    }
  }, [])

  return <Ctx.Provider value={{ socket, status, online }}>{children}</Ctx.Provider>
}
