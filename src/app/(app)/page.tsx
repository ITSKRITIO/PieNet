import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Images, Megaphone, MessageCircle, Pin } from 'lucide-react'
import { LocalTime } from '@/components/LocalTime'
import { OnlineCount } from '@/components/PresenceDot'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { messageCutoff } from '@/lib/messages'
import { getSettings } from '@/lib/settings'
import { DEFAULT_PLAN_MS } from '@/lib/utils'

function CardShell({ href, icon: Icon, title, children, cta }: { href: string; icon: typeof Images; title: string; children: React.ReactNode; cta: string }) {
  return (
    <section className="card card-link flex flex-col p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 font-medium">
          <Icon className="h-4 w-4 text-accent" aria-hidden />
          {title}
        </h2>
        <Link href={href} className="inline-flex items-center gap-1 text-[13px] text-muted transition hover:text-accent">
          {cta} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="py-6 text-sm text-muted">{children}</p>

export default async function HomePage() {
  const session = await requireUser()
  const s = await getSettings()
  const now = new Date()
  const recentStart = new Date(now.getTime() - DEFAULT_PLAN_MS)

  const [messages, plans, announcements, photos, albumCount] = await Promise.all([
    s.homeSections.chat
      ? prisma.message.findMany({
          where: { createdAt: { gte: messageCutoff() } },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { user: { select: { username: true } } },
        })
      : [],
    s.homeSections.plans
      ? prisma.plan.findMany({
          where: { OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: recentStart } }] },
          orderBy: { startsAt: 'asc' },
          take: 3,
          include: { _count: { select: { participants: true } } },
        })
      : [],
    s.homeSections.announcements
      ? prisma.announcement.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }], take: 3, include: { author: { select: { username: true } } } })
      : [],
    s.homeSections.memories
      ? prisma.photo.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, albumId: true } })
      : [],
    s.homeSections.memories ? prisma.album.count() : 0,
  ])

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden py-6 sm:py-10">
        <span aria-hidden className="pointer-events-none absolute -right-4 -top-16 select-none font-serif text-[22rem] leading-none text-accent/[0.05] sm:text-[30rem]">
          {s.logoMark}
        </span>
        <p className="relative text-sm text-muted">Welcome back, @{session.user.username}</p>
        <h1 className="relative mt-3 max-w-3xl bg-gradient-to-b from-fg to-fg/55 bg-clip-text font-serif text-5xl leading-[1.05] text-transparent sm:text-7xl">
          {s.slogan}
        </h1>
        <p className="relative mt-5 flex items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
          <OnlineCount />
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {s.homeSections.chat && (
          <CardShell href="/chat" icon={MessageCircle} title="Global Chat" cta="Open chat">
            {messages.length === 0 ? (
              <Empty>It’s quiet in here. Say hello and start the conversation.</Empty>
            ) : (
              <ul className="space-y-3">
                {[...messages].reverse().map((m) => (
                  <li key={m.id} className="text-sm">
                    <span className="text-accent">@{m.user.username}</span>
                    <span className="ml-2 text-fg/80">{m.content.length > 90 ? `${m.content.slice(0, 90)}…` : m.content}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-muted">Messages disappear after 24 hours.</p>
          </CardShell>
        )}

        {s.homeSections.plans && (
          <CardShell href="/plans" icon={CalendarDays} title="Plans" cta="All plans">
            {plans.length === 0 ? (
              <Empty>Nothing planned yet. Suggest something for the group.</Empty>
            ) : (
              <ul className="space-y-3.5">
                {plans.map((p) => (
                  <li key={p.id} className="flex items-center gap-4">
                    <div className="w-11 shrink-0 rounded-lg border border-fg/10 py-1.5 text-center">
                      <LocalTime iso={p.startsAt.toISOString()} format="month" className="block text-[11px] text-muted" />
                      <LocalTime iso={p.startsAt.toISOString()} format="day" className="block text-base font-semibold leading-tight" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="truncate text-xs text-muted">
                        <LocalTime iso={p.startsAt.toISOString()} format="time" />
                        {p.location && ` · ${p.location}`}
                        {` · ${p._count.participants} going or maybe`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardShell>
        )}

        {s.homeSections.announcements && (
          <CardShell href="/announcements" icon={Megaphone} title="Announcements" cta="All announcements">
            {announcements.length === 0 ? (
              <Empty>No announcements yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-accent" aria-label="Pinned" />}
                      {a.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{a.content}</p>
                    <p className="mt-1 text-xs text-muted">
                      @{a.author.username} · <LocalTime iso={a.createdAt.toISOString()} format="date" />
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardShell>
        )}

        {s.homeSections.memories && (
          <CardShell href="/memories" icon={Images} title="Memories" cta="Browse albums">
            {photos.length === 0 ? (
              <Empty>No photos yet. Create an album and add the first ones.</Empty>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <Link key={p.id} href={`/memories/${p.albumId}`} className="block overflow-hidden rounded-lg border border-fg/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/media/thumbs/${p.id}.webp`} alt="Recent memory" loading="lazy" className="aspect-square w-full object-cover transition duration-300 hover:scale-105" />
                    </Link>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted">
                  {albumCount} {albumCount === 1 ? 'album' : 'albums'} in total
                </p>
              </>
            )}
          </CardShell>
        )}
      </div>
    </div>
  )
}
