import { AUDIT, NEWSLETTER_PROMISE, POSITIONING, SERVICES } from './offer.ts'
import type { JournalMeta, StaticPage } from './pageShell.ts'
import { pageShell } from './pageShell.ts'
import type { ProofItem } from './proof.ts'
import { liveProofItems, sourceCommitUrl } from './proof.ts'
import { escapeMarkup } from './text.ts'
import { basePath, workUrl } from './urls.ts'

/*
 * /work/ — the service page. The homepage answers "what is he doing?"; this one
 * answers "what can he do for me?", which is the only question a visitor
 * arriving from Show HN can convert on.
 *
 * It is built ONLY while a proof item passes the same gate the homepage section
 * uses. Selling agent-reliability work on the strength of an unlinkable claim is
 * exactly the thing this site exists to argue against, so with no receipts there
 * is no page — not an empty one, and nothing in the sitemap or the footer
 * pointing at it either.
 */

function servicesMarkup(): string {
  return SERVICES.map(
    (service) =>
      `          <li><b>${escapeMarkup(service.name)}</b><span> — ${escapeMarkup(service.text)}</span></li>`,
  ).join('\n')
}

/** The priced package: cost, timebox, counted deliverables, access checklist. */
function auditMarkup(): string {
  const steps = (items: readonly string[]) =>
    items.map((item) => `            <li>${escapeMarkup(item)}</li>`).join('\n')
  return `        <div class="package">
          <h2>${escapeMarkup(AUDIT.name)}</h2>
          <p class="price">${escapeMarkup(AUDIT.price)}</p>
          <p class="timebox">${escapeMarkup(AUDIT.timebox)}</p>
          <h3>${escapeMarkup(AUDIT.deliverablesLabel)}</h3>
          <ol class="steps">
${steps(AUDIT.deliverables)}
          </ol>
          <h3>${escapeMarkup(AUDIT.prerequisitesLabel)}</h3>
          <ul class="checklist">
${steps(AUDIT.prerequisites)}
          </ul>
          <p class="next">${escapeMarkup(AUDIT.next)}</p>
        </div>`
}

function receiptMarkup(item: ProofItem): string {
  const commitUrl = sourceCommitUrl(item)
  const stats =
    item.stats.length > 0
      ? `\n        <p class="stats">${escapeMarkup(item.stats.join(' · '))}</p>`
      : ''
  const pin = item.sourceCommit
    ? `\n        <p class="pin">verified against commit ${
        commitUrl
          ? `<a href="${escapeMarkup(commitUrl)}" rel="noreferrer">${escapeMarkup(item.sourceCommit)}</a>`
          : escapeMarkup(item.sourceCommit)
      }</p>`
    : ''
  return `        <h3><a href="${escapeMarkup(item.url)}" rel="noreferrer">${escapeMarkup(item.title)} ↗</a></h3>
        <p>${escapeMarkup(item.description)}</p>${stats}${pin}`
}

interface WorkPageOptions {
  meta: JournalMeta
  items: readonly ProofItem[]
}

/** The service page, or null while nothing has receipts to stand on. */
export function buildWorkPage({ meta, items }: WorkPageOptions): StaticPage | null {
  const live = liveProofItems(items)
  if (live.length === 0) return null

  const url = workUrl(meta.siteUrl)
  const base = basePath(meta.siteUrl)
  const contact = meta.contactEmail
  const description = `${POSITIONING.claim} ${POSITIONING.rule} A ${AUDIT.price} reliability audit for AI agents — three business days, a counted list of deliverables, and a public reproducible teardown as the reference.`

  const receipts = live.map((item) => receiptMarkup(item)).join('\n')

  const cta = contact
    ? `      <p class="cta">Send me the repo or a description of the agent, and what "wrong" looks
        like for you → <a href="mailto:${escapeMarkup(contact)}">${escapeMarkup(contact)}</a><br />
        You get a written answer on whether I can help, and what I would do first.</p>`
    : ''

  const body = `      <main>
        <p class="eyebrow">Work with me</p>
        <h1>${escapeMarkup(POSITIONING.claim)}</h1>
        <p class="dateline">${escapeMarkup(POSITIONING.rule)}</p>
        <div class="prose">
          <p>Most agent failures are not crashes. A tool call comes back empty, a check cannot
          reach what it was meant to inspect, a retrieval step finds nothing — and the agent
          reports success anyway. The run is green, the answer is wrong, and nobody finds out
          until a user does.</p>
          <p>I find those paths, make each one reproducible, and close them: the failed check has
          to say no. Then I leave behind the corpus and the CI gate that stop them coming back.</p>
        </div>
        <ul class="services">
${servicesMarkup()}
        </ul>
${auditMarkup()}
        <div class="receipt">
          <h2>The reference — public, reproducible, still runnable</h2>
${receipts}
        </div>
${cta}
        <p class="promise">${escapeMarkup(NEWSLETTER_PROMISE)}</p>
        <p class="terms">Not hiring yet? The weekly finding is the same work, in public —
        <a href="${base}silent-green/">read the series</a>.</p>
      </main>`

  return {
    path: 'work/index.html',
    html: pageShell({
      meta,
      lang: 'en',
      title: `Work with me — agent reliability · ${meta.siteName}`,
      description,
      canonical: url,
      crumb: { href: base, label: 'the ledger' },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': url,
        name: `Work with me — agent reliability · ${meta.siteName}`,
        url,
        description,
        about: { '@id': `${meta.siteUrl}#person` },
        isPartOf: { '@id': `${meta.siteUrl}#website` },
        inLanguage: 'en',
      },
      body,
    }),
  }
}
