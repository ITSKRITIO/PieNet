'use client'
import { useRealtime } from './RealtimeProvider'
import { cn } from '@/lib/utils'

/** Green when the member is online. Pass `self` for the signed-in user (tracks this tab's connection). */
export function PresenceDot({
  userId,
  self,
  label,
  className,
}: {
  userId: string
  self?: boolean
  label?: boolean
  className?: string
}) {
  const { online, status } = useRealtime()
  const isOnline = self ? status === 'connected' : online.has(userId)
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2.5 w-2.5" role="img" aria-label={isOnline ? 'Online' : 'Offline'}>
        {isOnline && <span className="absolute inline-flex h-full w-full animate-ping2 rounded-full bg-emerald-400/60" />}
        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-bg', isOnline ? 'bg-emerald-400' : 'bg-fg/25')} />
      </span>
      {label && <span className="text-xs text-muted">{isOnline ? 'Online' : 'Offline'}</span>}
    </span>
  )
}

export function OnlineCount({ className }: { className?: string }) {
  const { online, status } = useRealtime()
  const n = online.size
  return (
    <span className={className}>
      {status === 'connected' ? `${n} ${n === 1 ? 'member' : 'members'} online` : 'Connecting…'}
    </span>
  )
}
