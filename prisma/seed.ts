// Development seed. Run explicitly with:  npm run db:seed
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import sharp from 'sharp'

const PASSWORD = 'PieDev!2345'

function art(hue: number, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},70%,18%)"/><stop offset="1" stop-color="#05070d"/></linearGradient></defs>
    <rect width="1600" height="1100" fill="url(#g)"/>
    <text x="800" y="680" font-size="520" text-anchor="middle" fill="#38bdf8" fill-opacity="0.85" font-family="Georgia, serif">π</text>
    <text x="800" y="960" font-size="56" text-anchor="middle" fill="#f5f8ff" fill-opacity="0.7" font-family="Arial, sans-serif">${label}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed in production. Pass --force if you really mean it.')
    process.exit(1)
  }

  // Imported here so loadEnvConfig above has already run.
  const { prisma } = await import('../src/lib/db')
  const { hashPassword } = await import('../src/lib/password')
  const { storeImage } = await import('../src/lib/storage')

  const hash = await hashPassword(PASSWORD)
  const names = ['alice', 'bob', 'carol', 'dave']
  const bios = ['Plans everything.', 'Here for the group chat.', 'Photographer, sort of.', 'Usually late.']
  const users = []
  for (const [i, username] of names.entries()) {
    users.push(
      await prisma.user.upsert({
        where: { username },
        create: { username, passwordHash: hash, bio: bios[i] },
        update: {},
      }),
    )
  }
  const [alice, bob, carol, dave] = users
  const hours = (h: number) => new Date(Date.now() + h * 3600_000)

  if ((await prisma.plan.count()) === 0) {
    await prisma.plan.createMany({
      data: [
        { title: 'Game night', description: 'Bring snacks. Board games and cards.', location: "Alice's place", startsAt: hours(52), creatorId: alice.id },
        { title: 'Sunday hike', description: 'Easy trail, back before dark.', location: 'North trailhead', startsAt: hours(120), endsAt: hours(124), creatorId: bob.id },
        { title: 'Movie marathon', description: '', location: 'Online', startsAt: hours(-1), endsAt: hours(3), creatorId: carol.id },
        { title: 'Pizza catch-up', description: 'Last month’s dinner.', location: 'Corner pizzeria', startsAt: hours(-200), creatorId: dave.id },
      ],
    })
    const game = await prisma.plan.findFirst({ where: { title: 'Game night' } })
    if (game) {
      await prisma.planParticipant.createMany({
        data: [
          { planId: game.id, userId: bob.id, status: 'GOING' },
          { planId: game.id, userId: carol.id, status: 'MAYBE' },
        ],
      })
    }
  }

  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.createMany({
      data: [
        { title: 'Welcome to PIE', content: 'This is our private corner of the internet. Be kind, keep it fun.', pinned: true, authorId: alice.id },
        { title: 'Photo albums are live', content: 'Add your pictures under Memories. They stay until someone deletes them.', authorId: bob.id },
      ],
    })
  }

  if ((await prisma.message.count()) === 0) {
    await prisma.message.createMany({
      data: [
        { userId: alice.id, content: 'Morning everyone 👋', createdAt: new Date(Date.now() - 3 * 3600_000) },
        { userId: bob.id, content: 'Anyone up for game night this week?', createdAt: new Date(Date.now() - 2.5 * 3600_000) },
        { userId: carol.id, content: 'I’m in. Will bring snacks.', createdAt: new Date(Date.now() - 2 * 3600_000) },
      ],
    })
  }

  if ((await prisma.album.count()) === 0) {
    const album = await prisma.album.create({
      data: { name: 'Summer trip', description: 'The long weekend by the lake.', creatorId: carol.id },
    })
    const labels = ['Sunrise', 'Lake', 'Campfire', 'Road home', 'Trailhead', 'Group shot']
    for (const [i, label] of labels.entries()) {
      const stored = await storeImage(await art(190 + i * 12, label))
      await prisma.photo.create({
        data: { ...stored, albumId: album.id, uploaderId: [alice, bob, carol, dave][i % 4].id },
      })
    }
  }

  console.log(`Seeded users (${names.join(', ')}) with password: ${PASSWORD}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
