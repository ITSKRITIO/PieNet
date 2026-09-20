'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Avatar } from './Avatar'
import { EmptyState } from './PageHeader'
import { LocalTime } from './LocalTime'
import { PresenceDot } from './PresenceDot'
import { useRealtime } from './RealtimeProvider'
import { api } from '@/lib/client'

export type MemberDTO = { id: string; username: string; bio: string; createdAt: string }

export function MembersView({ initial, meId }: { initial: MemberDTO[]; meId: string }) {
  const { online } = useRealtime()
  const [query, setQuery] = useState('')
  const [members, setMembers] = useState(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setMembers(initial)
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      api<{ members: MemberDTO[] }>(`/api/members?q=${encodeURIComponent(q)}`)
        .then((r) => setMembers(r.members))
        .catch(() => setMembers([]))
        .finally(() => setLoading(false))
    }, 220)
    return () => clearTimeout(t)
  }, [query, initial])

  // Online members first, then alphabetically.
  const sorted = [...members].sort((a, b) => {
    const diff = Number(online.has(b.id)) - Number(online.has(a.id))
    return diff !== 0 ? diff : a.username.localeCompare(b.username)
  })

  return (
    <>
      <div className="relative mb-8 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          className="input pl-9"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username"
          aria-label="Search members by username"
        />
      </div>

      {loading ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading members">
          {[0, 1, 2].map((i) => (
            <li key={i} className="skeleton h-[104px]" />
          ))}
        </ul>
      ) : sorted.length === 0 ? (
        <EmptyState title="No members found" message={`Nobody matches “${query.trim()}”. Try a different username.`} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <li key={m.id}>
              <Link href={`/members/${m.username}`} className="card card-link flex items-center gap-4 p-5">
                <Avatar size={44} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium">
                    @{m.username}
                    {m.id === meId && <span className="chip">You</span>}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted">{m.bio || 'No bio yet'}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                    <PresenceDot userId={m.id} self={m.id === meId} label />
                    <span aria-hidden>·</span>
                    <span>
                      Joined <LocalTime iso={m.createdAt} format="date" />
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
