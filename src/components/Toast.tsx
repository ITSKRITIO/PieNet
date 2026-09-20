'use client'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Kind = 'success' | 'error' | 'info'
type Item = { id: number; kind: Kind; message: string }
type Api = { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }

const Ctx = createContext<Api>({ success: () => {}, error: () => {}, info: () => {} })
export const useToast = () => useContext(Ctx)

const icons = { success: CheckCircle2, error: XCircle, info: Info }
const tone = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-accent' }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (kind: Kind, message: string) => {
      const id = nextId.current++
      setItems((p) => [...p.slice(-3), { id, kind, message }])
      setTimeout(() => dismiss(id), kind === 'error' ? 6500 : 4200)
    },
    [dismiss],
  )
  const api = useMemo<Api>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }),
    [push],
  )

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {items.map((t) => {
          const Icon = icons[t.kind]
          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className="panel pointer-events-auto flex w-full max-w-sm animate-toast items-start gap-3 py-3 pl-4 pr-2 text-sm"
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone[t.kind])} aria-hidden />
              <p className="flex-1 leading-relaxed">{t.message}</p>
              <button className="btn-icon" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
