import type { Metadata } from 'next'
import { AlbumsView } from '@/components/AlbumsView'
import { PageHeader } from '@/components/PageHeader'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Memories' }

export default async function MemoriesPage() {
  await requireUser()
  const rows = await prisma.album.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { username: true } },
      _count: { select: { photos: true } },
      photos: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true } },
    },
  })
  return (
    <>
      <PageHeader title="Memories" subtitle="The group’s photo album. Nothing here expires." />
      <AlbumsView
        albums={rows.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          createdAt: a.createdAt.toISOString(),
          creator: a.creator,
          photoCount: a._count.photos,
          cover: a.photos[0]?.id ?? null,
        }))}
      />
    </>
  )
}
