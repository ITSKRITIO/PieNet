import { loadEnvConfig } from '@next/env'

// Load .env before anything that reads it (Prisma reads DATABASE_URL when the client is built),
// which is why the rest of the imports below are dynamic.
loadEnvConfig(process.cwd())

const dev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT) || 3000
const host = process.env.HOST || '0.0.0.0'

async function main() {
  const { createServer } = await import('node:http')
  const { default: next } = await import('next')
  const { env } = await import('./src/lib/env')
  const { prisma } = await import('./src/lib/db')
  const { attachRealtime } = await import('./src/server/realtime')
  const { startJobs } = await import('./src/server/jobs')

  void env.sessionSecret // fail fast when SESSION_SECRET is missing or too short
  if (!env.adminCodeHash) {
    console.warn('[pie] ADMIN_CODE_HASH_B64 is not set, so admin sign-in is disabled. Run `npm run admin:hash`.')
  }

  const app = next({ dev, hostname: 'localhost', port })
  const handle = app.getRequestHandler()
  const upgrade = app.getUpgradeHandler()
  await app.prepare()

  const server = createServer((req, res) => {
    handle(req, res).catch((e) => {
      console.error('[pie] request failed', e)
      res.statusCode = 500
      res.end('Internal server error')
    })
  })

  attachRealtime(server)

  // Socket.IO claims /socket.io; every other upgrade (Next's dev HMR socket) goes back to Next.
  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/socket.io')) void upgrade(req, socket, head)
  })

  const stopJobs = startJobs()

  server.listen(port, host, () => {
    console.log(`[pie] ready on http://localhost:${port} (${dev ? 'development' : 'production'})`)
  })

  const shutdown = async () => {
    stopJobs()
    server.close()
    await prisma.$disconnect().catch(() => undefined)
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
