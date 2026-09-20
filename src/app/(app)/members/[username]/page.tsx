import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Images, Settings } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { LocalTime } from '@/components/LocalTime'
import { PresenceDot } from '@/components/PresenceDot'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { usernameSchema } from '@/lib/validation'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `@${params.username}` }
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await requireUser()
  const parsed = usernameSchema.safeParse(decodeURIComponent(params.username))
  if (!parsed.success) notFound()

  const user = await prisma.user.findUnique({
    where: { username: parsed.data },
    select: {
      id: true,
      username: true,
      bio: true,
      createdAt: true,
      disabled: true,
      _count: { select: { plans: true, photos: true, announcements: true } },
      plans: { orderBy: { startsAt: 'desc' }, take: 4, select: { id: true, title: true, startsAt: true } },
      photos: { orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, albumId: true } },
    },
  })
  if (!user || (user.disabled && !session.isAdmin)) notFound()
  const isMe = user.id === session.user.id

  return (
    <div className="mx-auto max-w-3xl">
      <section className="card flex flex-col items-start gap-6 p-7 sm:flex-row sm:items-center">
        <Avatar size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-3 font-serif text-3xl">
            @{user.username}
            <PresenceDot userId={user.id} self={isMe} label />
            {user.disabled && <span className="chip border-red-400/30 text-red-300">Disabled</span>}
          </h1>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/80">{user.bio || 'No bio yet.'}</p>
          <p className="mt-3 text-xs text-muted">
            Member since <LocalTime iso={user.createdAt.toISOString()} format="date" /> · {user._count.plans} plans ·{' '}
            {user._count.photos} photos · {user._count.announcements} announcements
          </p>
        </div>
        {isMe && (
          <Link href="/settings" className="btn btn-ghost btn-sm shrink-0">
            <Settings className="h-3.5 w-3.5" aria-hidden /> Edit profile
          </Link>
        )}
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-accent" aria-hidden /> Plans created
          </h2>
          {user.plans.length === 0 ? (
            <p className="text-sm text-muted">No plans yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {user.plans.map((p) => (
                <li key={p.id} className="text-sm">
                  <Link href="/plans" className="hover:text-accent">
                    {p.title}
                  </Link>
                  <span className="ml-2 text-xs text-muted">
                    <LocalTime iso={p.startsAt.toISOString()} format="date" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Images className="h-4 w-4 text-accent" aria-hidden /> Recent photos
          </h2>
          {user.photos.length === 0 ? (
            <p className="text-sm text-muted">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {user.photos.map((p) => (
                <Link key={p.id} href={`/memories/${p.albumId}`} className="overflow-hidden rounded-md border border-fg/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/thumbs/${p.id}.webp`} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
