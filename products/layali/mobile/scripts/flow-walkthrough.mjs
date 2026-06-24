/**
 * Parcours automatisé de tous les flows Layali mobile (prototype).
 * Usage: node scripts/flow-walkthrough.mjs
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const results = []

function log(step, status, detail = '') {
  results.push({ step, status, detail })
  const icon = status === 'ok' ? '✓' : status === 'warn' ? '!' : '✗'
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`)
}

async function snippet(page) {
  const t = await page.locator('main').first().innerText().catch(() => '')
  return t.slice(0, 180).replace(/\s+/g, ' ')
}

async function tap(page, pattern, opts = {}) {
  const btn = page.getByRole('button', { name: pattern })
  await btn.first().click({ timeout: 8000, force: opts.force ?? false })
}

async function navTab(page, label) {
  await page.locator('.bottom-nav button').filter({ hasText: label }).click({ force: true })
  await page.waitForTimeout(350)
}

async function leaveConfirm(page) {
  if ((await page.locator('.bottom-nav').count()) > 0) return
  const homeBtn = page.getByRole('button', { name: /Retour a l accueil|Retour aux evenements/i })
  if (await homeBtn.count()) {
    await homeBtn.first().click({ force: true })
    await page.waitForTimeout(350)
  }
}

async function checkOverlap(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav')
    const cta = document.querySelector('.sticky-cta')
    if (!nav || !cta) return null
    const nr = nav.getBoundingClientRect()
    const cr = cta.getBoundingClientRect()
    return cr.bottom > nr.top && cr.top < nr.bottom
  })
}

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 })

    // ── FLOW 1 : Discovery home ─────────────────────────────────────────────
    log('F1 Home', 'ok', await snippet(page))
    await tap(page, /Rechercher/i)
    log('F1 Home → recherche icône', 'ok')
    await navTab(page, 'Accueil')

    await page.locator('.feed-card button', { hasText: 'Voir le lieu' }).first().click()
    await page.waitForTimeout(350)
    log('F1 Home → détail lieu (carte)', 'ok', await snippet(page))
    await tap(page, /Retour/i)

    // Chips home (cosmétiques)
    await navTab(page, 'Accueil')
    await page.locator('.filter-chip', { hasText: 'Guest list' }).click()
    log('F1 Chips home', 'ok', 'chip Guest list cliquable')

    // ── FLOW 2 : Lieux → table booking complet ──────────────────────────────
    await navTab(page, 'Lieux')
    log('F2 Recherche lieux', 'ok', await snippet(page))

    await page.locator('.filter-chip', { hasText: 'Table' }).click()
    log('F2 Filtres lieux', 'ok', 'chip Table active')

    await page.locator('.venue-card').first().click()
    log('F2 Détail lieu (Aether)', 'ok', await snippet(page))

    const overlapDetail = await checkOverlap(page)
    log('F2 Overlap CTA/nav (détail)', overlapDetail ? 'fail' : 'ok',
      overlapDetail ? 'sticky CTA masqué par bottom nav' : 'pas de chevauchement')

    await tap(page, /Reserver une table/i)
    const navHidden = (await page.locator('.bottom-nav').count()) === 0
    log('F2 Booking 1/3', navHidden ? 'ok' : 'fail', `nav masquée: ${navHidden}`)

    const crumb = await page.locator('.flow-crumb').innerText()
    log('F2 Fil d Ariane', crumb.includes('›') ? 'ok' : 'warn', crumb)

    await tap(page, /Continuer/i)
    log('F2 Booking 2/3 paiement', 'ok', await snippet(page))

    const timer = await page.locator('.draft-timer strong').innerText()
    log('F2 Timer countdown', /^\d+:\d{2}$/.test(timer) ? 'ok' : 'warn', timer)

    const stripe = page.getByRole('button', { name: /Stripe/i })
    if (await stripe.count()) {
      await stripe.first().click()
      await page.locator('.checkbox-label input').check()
      await page.locator('.sticky-cta ion-button').first().click()
    } else {
      await page.locator('.checkbox-label input').check()
      await page.locator('.sticky-cta ion-button').first().click()
    }
    await page.waitForTimeout(400)
    log('F2 Booking 3/3 confirm', 'ok', await snippet(page))

    // ── FLOW 3 : Mes réservations ─────────────────────────────────────────
    await tap(page, /Voir mes reservations/i)
    await page.waitForTimeout(300)
    log('F3 Liste réservations', 'ok', await snippet(page))

    await page.getByRole('button', { name: 'Passées' }).click()
    await page.waitForTimeout(300)
    const emptyPast = await page.locator('.empty-state').count()
    log('F3 Onglet Passées', emptyPast ? 'ok' : 'warn', emptyPast ? 'état vide affiché' : 'contenu passé')

    await page.getByRole('button', { name: 'À venir' }).click()
    await page.getByRole('button', { name: /Voir détail/i }).first().click()
    log('F3 Détail réservation', 'ok', await snippet(page))

    const overlapBookingDetail = await checkOverlap(page)
    log('F3 Overlap CTA/nav (détail resa)', overlapBookingDetail ? 'fail' : 'ok')

    await page.getByRole('button', { name: /Retour aux réservations/i }).click({ timeout: 5000 })
    await page.waitForTimeout(300)
    log('F3 Sticky CTA cliquable', 'ok', 'Retour aux réservations')

    // ── FLOW 4 : Guest list (Mirage) ───────────────────────────────────────
    await navTab(page, 'Lieux')
    await page.locator('.venue-card', { hasText: 'Mirage' }).click()
    await tap(page, /Demander une guest list/i)
    log('F4 Guest list 1/3', 'ok', await snippet(page))

    await tap(page, /Continuer/i)
    await page.locator('.checkbox-label input').check()
    await page.locator('.sticky-cta ion-button').first().click()
    await page.waitForTimeout(400)
    const pending = await page.locator('h1').first().innerText()
    log('F4 Guest list confirm', pending.includes('attente') ? 'ok' : 'warn',
      pending.includes('attente') ? pending : `approval auto → ${pending}`)

    await leaveConfirm(page)

    // ── FLOW 5 : Événements + billet ───────────────────────────────────────
    if ((await page.locator('.bottom-nav').count()) === 0) {
      await page.getByRole('button', { name: /Retour a l accueil/i }).click({ force: true })
      await page.waitForTimeout(350)
    }
    await navTab(page, 'Soirees')
    log('F5 Liste événements', 'ok', await snippet(page))

    await page.locator('.filter-chip', { hasText: 'Ticket' }).click()
    log('F5 Filtres événements', 'ok', 'chip Ticket cliquable')

    await page.locator('.event-card-large').first().click()
    log('F5 Détail événement', 'ok', await snippet(page))

    const overlapEvent = await checkOverlap(page)
    log('F5 Overlap CTA/nav (événement)', overlapEvent ? 'fail' : 'ok')

    await tap(page, /Acheter un billet/i)
    log('F5 Ticket 1/3', 'ok', await snippet(page))

    await tap(page, /Continuer vers le paiement/i)
    const ticketTimer = await page.locator('.draft-timer strong').innerText()
    log('F5 Ticket 2/3', /^\d+:\d{2}$/.test(ticketTimer) ? 'ok' : 'warn', `timer: ${ticketTimer}`)

    await page.getByRole('button', { name: /Stripe/i }).click()
    await page.locator('.checkbox-label input').check()
    await page.locator('.sticky-cta ion-button').first().click()
    await page.waitForTimeout(400)
    log('F5 Ticket 3/3', 'ok', await snippet(page))
    await leaveConfirm(page)

    // ── FLOW 6 : Comptoir (Palmeraie) ──────────────────────────────────────
    await navTab(page, 'Lieux')
    await page.locator('.venue-card', { hasText: 'Palmeraie' }).click()
    await tap(page, /Reserver au comptoir/i)
    log('F6 Comptoir 1/3', 'ok', await snippet(page))
    await tap(page, /Continuer/i)
    await page.locator('.checkbox-label input').check()
    await page.locator('.sticky-cta ion-button').first().click()
    log('F6 Comptoir confirm', 'ok', await snippet(page))
    await leaveConfirm(page)

    // ── FLOW 7 : Auth + profil ─────────────────────────────────────────────
    await navTab(page, 'Profil')
    log('F7 Profil (sans gate login)', 'warn', await snippet(page))

    await tap(page, /Se déconnecter/i)
    log('F7 Login', 'ok', await snippet(page))

    await tap(page, /Créer un compte/i)
    log('F7 Register', 'ok', await snippet(page))

    await page.locator('.screen-header button').first().click()
    await page.locator('.screen-header button').first().click()
    await navTab(page, 'Accueil')

    // ── Résumé copy EN restante ────────────────────────────────────────────
    const bodyText = await page.locator('body').innerText()
    const enPatterns = ['Access recap', 'Guest list policy', 'Minimum spend', 'Walk-in', 'Special night']
    const enFound = enPatterns.filter((p) => bodyText.includes(p))
    log('Copy EN résiduelle', enFound.length ? 'warn' : 'ok', enFound.join(', ') || 'aucune sur home')

    const failed = results.filter((r) => r.status === 'fail').length
    const warned = results.filter((r) => r.status === 'warn').length
    console.log('\n══════════════════════════════════════')
    console.log(`Parcours terminé : ${results.length} checks | ${failed} échecs | ${warned} avertissements`)
    console.log('══════════════════════════════════════\n')

    results.forEach((r) => {
      if (r.status !== 'ok') console.log(`  [${r.status.toUpperCase()}] ${r.step}: ${r.detail}`)
    })
  } catch (err) {
    log('Erreur fatale', 'fail', err.message)
    console.error(err)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

run()
