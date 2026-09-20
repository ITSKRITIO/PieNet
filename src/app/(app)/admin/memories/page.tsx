import type { Metadata } from 'next'
import { AdminModeration } from '@/components/admin/AdminModeration'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { formatBytes } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin · Memories' }

export default async function AdminMemoriesPage() {
  await requireAdmin()
  const [albums, storage] = await Promise.all([
    prisma.album.findMany({
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { username: true } }, _count: { select: { photos: true } } },
    }),
    prisma.photo.aggregate({ _sum: { bytes: true } }),
  ])
  return (
    <AdminModeration
      header={
        <div className="card p-5">
          <h2 className="text-sm font-medium">Albums</h2>
          <p className="mt-1 text-sm text-muted">
            Using {formatBytes(storage._sum.bytes ?? 0)} of photo storage. Open an album to remove individual photos.
          </p>
        </div>
      }
      rows={albums.map((a) => ({
        id: a.id,
        primary: a.name,
        secondary: [`${a._count.photos} photos`, a.description].filter(Boolean).join(' · '),
        author: a.creator.username,
        createdAt: a.createdAt.toISOString(),
        href: `/memories/${a.id}`,
      }))}
      endpoint={(id) => `/api/albums/${id}`}
      itemLabel="album"
      emptyTitle="No albums yet"
      emptyMessage="Albums created by members show up here."
      confirmMessage="The album and every photo in it will be deleted from the database and from disk."
    />
  )
}
