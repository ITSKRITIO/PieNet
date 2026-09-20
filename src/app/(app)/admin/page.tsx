import type { Metadata } from 'next'
import Link from 'next/link'
import { LocalTime } from '@/components/LocalTime'
import { OnlineCount } from '@/components/PresenceDot'
import { prisma } from '@/lib/db'
import { messageCutoff } from '@/lib/messages'
import { formatBytes } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin overview' }

function Stat({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const inner = (
    <>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </>
  )
  return href ? (
    <Link href={href} className="card card-link p-5">
      {inner}
    </Link>
  ) : (
    <div className="card p-5">{inner}</div>
  )
}

export default async function AdminOverview() {
  const [users, disabled, messages, plans, announcements, albums, photos, storage, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { disabled: true } }),
    prisma.message.count({ where: { createdAt: { gte: messageCutoff() } } }),
    prisma.plan.count(),
    prisma.announcement.count(),
    prisma.album.count(),
    prisma.photo.count(),
    prisma.photo.aggregate({ _sum: { bytes: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, username: true, createdAt: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Members" value={users} href="/admin/users" />
        <Stat label="Online now" value={<OnlineCount />} />
        <Stat label="Messages in the last 24h" value={messages} href="/admin/chat" />
        <Stat label="Disabled accounts" value={disabled} href="/admin/users" />
        <Stat label="Plans" value={plans} href="/admin/plans" />
        <Stat label="Announcements" value={announcements} href="/admin/announcements" />
        <Stat label={`Photos in ${albums} ${albums === 1 ? 'album' : 'albums'}`} value={photos} href="/admin/memories" />
        <Stat label="Photo storage used" value={formatBytes(storage._sum.bytes ?? 0)} />
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-medium">Newest members</h2>
        <ul className="space-y-2.5">
          {recent.map((u) => (
            <li key={u.id} className="flex items-center justify-between text-sm">
              <Link href={`/members/${u.username}`} className="hover:text-accent">
                @{u.username}
              </Link>
              <LocalTime iso={u.createdAt.toISOString()} format="date" className="text-xs text-muted" />
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="font-medium">How chat cleanup works</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          A background job runs every five minutes and deletes chat messages older than 24 hours. Reads are filtered by the same
          cutoff, so nothing expired is ever shown between runs. Profiles, plans, announcements, albums and photos are never
          touched by it.
        </p>
      </section>
    </div>
  )
}
