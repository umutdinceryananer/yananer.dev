/**
 * The weekly summary, pushed to the owner's phone through ntfy.
 *
 * The dashboard and the MCP endpoint both wait to be asked, and a number that
 * has to be gone and looked for is a number nobody looks at. This one arrives on
 * its own, once a week, as a notification -- the same summary site_summary
 * gives, cut to the few lines that fit on a lock screen.
 *
 * ── Why ntfy, and what that costs ────────────────────────────────────────────
 *
 * One HTTPS POST, no bot to register and no chat id to look up. On the public
 * ntfy.sh server the topic name is the only lock: anyone who knows it can read
 * what is sent and send to it. So the topic is long, random, and stored as a
 * Worker secret rather than in this repository -- and what goes out is weekly
 * totals and nothing about any one visitor, so a topic that did leak would give
 * away how many people visited a portfolio, not who.
 *
 * Sent as JSON rather than with ntfy's header form: the message is Turkish, and
 * HTTP headers cannot carry most of its letters.
 */

import { summarize } from './mcp'
import type { Env } from './worker'

/** Monday 07:00 UTC -- 10:00 in Tallinn in summer, 09:00 in winter. Must match
    the entry in wrangler.toml exactly; scheduled() tells the triggers apart by
    this string. */
export const WEEKLY_CRON = '0 7 * * 1'

type Summary = Awaited<ReturnType<typeof summarize>>

/** "www.google.com" -> "google", "linkedin (utm)" -> "linkedin". */
function sourceName(raw: string): string {
  if (raw === 'typed or bookmarked') return 'doğrudan'
  return raw.replace(/ \(utm\)$/, '').replace(/^www\./, '').replace(/\.com$/, '')
}

/** A handful of short lines. Colons rather than sentences, so no number ever
    needs a Turkish suffix that depends on how it is pronounced. */
export function formatDigest(s: Summary): string {
  const visits = s.visits.thisPeriod
  const before = s.visits.previousPeriod
  if (visits === 0) return `Bu hafta ziyaret yok (önceki hafta: ${before}).`

  const lines = [`Ziyaret: ${visits} (önceki hafta: ${before}) · geri gelen: ${s.browsers.cameBack}`]
  if (s.sources.length) {
    lines.push(`Kaynak: ${s.sources.map((x) => `${sourceName(x.source)} ${x.visits}`).join(' · ')}`)
  }
  const reading = s.reading ? ` · ortalama okuma: ${s.reading.averageActiveSeconds} sn` : ''
  lines.push(`Work'ü açan: ${s.openedWorkPage.thisPeriod}${reading}`)
  if (s.topClicks.length) lines.push(`En çok tıklanan: ${s.topClicks[0].what} (${s.topClicks[0].clicks})`)
  if (s.errors.length) {
    const total = s.errors.reduce((n, e) => n + e.times, 0)
    lines.push(`Hata: ${total} · ${s.errors[0].message.slice(0, 80)}`)
  }
  return lines.join('\n')
}

export async function sendWeeklyDigest(env: Env): Promise<void> {
  if (!env.NTFY_TOPIC) {
    console.log('weekly digest: NTFY_TOPIC is not set, nothing sent')
    return
  }
  const summary = await summarize(env.ANALYTICS_DB, 7)
  const res = await fetch('https://ntfy.sh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: env.NTFY_TOPIC,
      title: 'yananer.dev · bu hafta',
      message: formatDigest(summary),
      tags: ['bar_chart'],
      // Tapping the notification opens the dashboard, which asks for the
      // password -- the topic grants a summary, not the page.
      click: 'https://stats.yananer.dev',
    }),
  })
  // Logged, not thrown. Both triggers share one cron history in the dashboard,
  // and a red entry there should mean the retention delete failed -- the one
  // job whose failure has consequences -- not that a notification bounced.
  if (!res.ok) console.log(`weekly digest: ntfy answered ${res.status}`)
}
