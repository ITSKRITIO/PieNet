'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Opts = { title: string; message?: string; confirmLabel?: string; danger?: boolean }
type Pending = Opts & { resolve: (v: boolean) => void }

const Ctx = createContext<(o: Opts) => Promise<boolean>>(async () => false)
export const useConfirm = () => useContext(Ctx)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const ref = useRef<HTMLDialogElement>(null)

  const confirm = useCallback((o: Opts) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), [])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (pending && !d.open) d.showModal()
    if (!pending && d.open) d.close()
  }, [pending])

  const close = (v: boolean) => {
    pending?.resolve(v)
    setPending(null)
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <dialog
        ref={ref}
        className="dialog"
        aria-labelledby="confirm-title"
        onCancel={(e) => {
          e.preventDefault()
          close(false)
        }}
        onClick={(e) => e.target === ref.current && close(false)}
      >
        {pending && (
          <div className="panel w-[min(92vw,420px)] p-6">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {pending.title}
            </h2>
            {pending.message && <p className="mt-2 text-sm leading-relaxed text-muted">{pending.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => close(false)} autoFocus>
                Cancel
              </button>
              <button className={cn('btn', pending.danger ? 'btn-danger' : 'btn-primary')} onClick={() => close(true)}>
                {pending.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </Ctx.Provider>
  )
}
