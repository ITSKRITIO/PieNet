'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, SendHorizontal, Trash2, WifiOff } from 'lucide-react'
import { EmptyState } from './PageHeader'
import { PresenceDot } from './PresenceDot'
import { LocalTime } from './LocalTime'
import { useConfirm } from './Confirm'
import { useRealtime } from './RealtimeProvider'
import { useToast } from './Toast'
import { api } from '@/lib/client'
import { MESSAGE_TTL_MS, type ChatMessageDTO } from '@/lib/messages'
import { cn } from '@/lib/utils'

export function ChatView({ initial, meId, isAdmin }: { initial: ChatMessageDTO[]; meId: string; isAdmin: boolean }) {
  const { socket, status } = useRealtime()
  const toast = useToast()
  const confirm = useConfirm()
  const [messages, setMessages] = useState(initial)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  useEffect(() => {
    if (!socket) return
    const onNew = (m: ChatMessageDTO) => setMessages((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]))
    const onDeleted = ({ id }: { id: string }) => setMessages((p) => p.filter((m) => m.id !== id))
    const onPurged = ({ before }: { before: string }) => setMessages((p) => p.filter((m) => m.createdAt >= before))
    socket.on('message:new', onNew)
    socket.on('message:deleted', onDeleted)
    socket.on('messages:purged', onPurged)
    return () => {
      socket.off('message:new', onNew)
      socket.off('message:deleted', onDeleted)
      socket.off('messages:purged', onPurged)
    }
  }, [socket])

  // After (re)connecting, catch up on anything missed while offline.
  useEffect(() => {
    if (status !== 'connected') return
    api<{ messages: ChatMessageDTO[] }>('/api/messages')
      .then((r) => setMessages(r.messages))
      .catch(() => undefined)
  }, [status])

  // Hide anything that crosses the 24h line while the page is open.
  useEffect(() => {
    const t = setInterval(() => {
      const cutoff = new Date(Date.now() - MESSAGE_TTL_MS).toISOString()
      setMessages((p) => p.filter((m) => m.createdAt >= cutoff))
    }, 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = useCallback(() => {
    const content = text.trim()
    if (!content || !socket || status !== 'connected' || sending) return
    setSending(true)
    stick.current = true
    socket.timeout(8000).emit('message:send', { content }, (err: Error | null, res?: { ok: boolean; error?: string }) => {
      setSending(false)
      if (err) return toast.error('The message timed out. Try again.')
      if (!res?.ok) return toast.error(res?.error ?? 'Could not send your message.')
      setText('')
    })
  }, [text, socket, status, sending, toast])

  async function remove(id: string) {
    if (!(await confirm({ title: 'Delete this message?', message: 'It will be removed for everyone.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await api(`/api/messages/${id}`, { method: 'DELETE' })
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const connected = status === 'connected'

  return (
    <div className="card flex h-[calc(100dvh-15rem)] min-h-[420px] flex-col overflow-hidden">
      {!connected && (
        <div className="flex items-center gap-2 border-b border-fg/10 bg-amber-400/10 px-4 py-2 text-[13px] text-amber-200" role="status">
          {status === 'connecting' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <WifiOff className="h-3.5 w-3.5" aria-hidden />}
          {status === 'connecting' ? 'Connecting…' : 'Connection lost. Reconnecting…'}
        </div>
      )}

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className="flex-1 space-y-0.5 overflow-y-auto px-4 py-5 sm:px-6"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center">
            <EmptyState title="No messages yet" message="Be the first to say something. Everything here clears itself after 24 hours." />
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1]
            const grouped = prev && prev.user.id === m.user.id && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000
            return (
              <div key={m.id} className={cn('group relative flex items-start gap-2 rounded-md px-2 py-0.5 hover:bg-fg/[0.03]', !grouped && 'mt-4')}>
                <div className="min-w-0 flex-1">
                  {!grouped && (
                    <div className="mb-0.5 flex items-center gap-2">
                      <Link href={`/members/${m.user.username}`} className="text-sm font-medium text-accent hover:underline">
                        @{m.user.username}
                      </Link>
                      <PresenceDot userId={m.user.id} self={m.user.id === meId} />
                      <LocalTime iso={m.createdAt} format="time" className="text-xs text-muted" />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/90">{m.content}</p>
                </div>
                {(m.user.id === meId || isAdmin) && (
                  <button
                    onClick={() => remove(m.id)}
                    className="btn-icon opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label="Delete message"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-fg/10 p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            className="input max-h-40 resize-none"
            rows={1}
            value={text}
            maxLength={500}
            disabled={!connected}
            placeholder={connected ? 'Write a message' : 'Waiting for connection…'}
            aria-label="Message"
            onChange={(e) => {
              setText(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button className="btn btn-primary h-10 w-10 shrink-0 px-0" onClick={send} disabled={!connected || sending || !text.trim()} aria-label="Send message">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Messages disappear after 24 hours.</span>
          {text.length > 400 && <span className={text.length >= 500 ? 'text-red-300' : ''}>{text.length}/500</span>}
        </div>
      </div>
    </div>
  )
}
