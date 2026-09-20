import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AlbumDetail } from '@/components/AlbumDetail'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { env } from '@/lib/env'

async function load(id: string) {
  return prisma.album.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, username: true } },
      photos: { orderBy: { createdAt: 'asc' }, include: { uploader: { select: { id: true, username: true } } } },
    },
  })
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const album = await prisma.album.findUnique({ where: { id: params.id }, select: { name: true } })
  return { title: album?.name ?? 'Album' }
}

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const session = await requireUser()
  const album = await load(params.id)
  if (!album) notFound()
  return (
    <AlbumDetail
      album={{
        id: album.id,
        name: album.name,
        description: album.description,
        createdAt: album.createdAt.toISOString(),
        creator: album.creator,
      }}
      photos={album.photos.map((p) => ({
        id: p.id,
        width: p.width,
        height: p.height,
        bytes: p.bytes,
        createdAt: p.createdAt.toISOString(),
        uploader: p.uploader,
      }))}
      meId={session.user.id}
      isAdmin={session.isAdmin}
      maxUploadMb={Math.round(env.maxUploadBytes / 1048576)}
    />
  )
}
