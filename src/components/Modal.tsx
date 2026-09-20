'use client'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className={`panel max-h-[90dvh] overflow-y-auto p-6 ${wide ? 'w-[min(94vw,640px)]' : 'w-[min(94vw,480px)]'}`}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button className="btn-icon -mr-2" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
