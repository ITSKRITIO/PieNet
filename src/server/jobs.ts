import { purgeExpiredMessages, purgeExpiredSessions } from '../lib/cleanup'
import { pruneRateLimits } from '../lib/rate-limit'

const INTERVAL_MS = 5 * 60 * 1000

/**
 * Scheduled cleanup: runs at startup and every 5 minutes.
 * Chat history reads also filter by the 24h cutoff, so nothing expired is ever shown between runs.
 */
export function startJobs() {
  const run = async () => {
    try {
      const removed = await purgeExpiredMessages()
      if (removed > 0) console.log(`[pie] removed ${removed} expired chat message(s)`)
      await purgeExpiredSessions()
      pruneRateLimits()
    } catch (e) {
      console.error('[pie] cleanup job failed', e)
    }
  }
  void run()
  const timer = setInterval(run, INTERVAL_MS)
  timer.unref()
  return () => clearInterval(timer)
}
