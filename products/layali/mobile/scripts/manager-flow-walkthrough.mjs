/**
 * Parcours automatisé — espace Manager Layali (prototype).
 * Usage: node scripts/manager-flow-walkthrough.mjs [baseUrl]
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:5173'
const results = []

function log(step, status, detail = '') {
  results.push({ step, status, detail })
  const icon = status === 'ok' ? '✓' : status === 'warn' ? '!' : '✗'
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`)
}

async function snippet(page) {
  const t = await page.locator('main').first().innerText().catch(() => '')
  return t.slice(0, 160).replace(/\s+/g, ' ')
}

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 })
    log('M0 Entry', 'ok', await snippet(page))

    await page.getByRole('button', { name: /Manager/i }).click()
    await page.waitForTimeout(400)
    log('M1 Pro login choice', 'ok', await snippet(page))

    await page.getByRole('button', { name: /Je suis manager/i }).click()
    await page.waitForTimeout(300)
    await page.locator('form.login-form ion-button, form ion-button').first().click()
    await page.waitForTimeout(500)
    log('M2 Dashboard', 'ok', await snippet(page))

    const venueName = await page.locator('.header-top h1').innerText().catch(() => '')
    log('M2 Session venue', venueName.includes('Sky') ? 'ok' : 'warn', venueName)

    // KPIs
    const kpiCount = await page.locator('.kpi-card').count()
    log('M2 KPIs', kpiCount >= 4 ? 'ok' : 'warn', `${kpiCount} cartes`)

    // Nav manager
    await page.locator('.bottom-nav button', { hasText: 'Equipe' }).click()
    await page.waitForTimeout(400)
    log('M3 Access requests list', 'ok', await snippet(page))

    await page.locator('.request-card').first().click()
    await page.waitForTimeout(400)
    log('M3 Request detail', 'ok', await snippet(page))

    await page.getByRole('button', { name: /Approuver/i }).click()
    await page.waitForTimeout(400)
    log('M3 Approve request', 'ok', 'traitement mock')

    await page.locator('.bottom-nav button', { hasText: 'Resas' }).click()
    await page.waitForTimeout(400)
    log('M4 Bookings list', 'ok', await snippet(page))

    await page.locator('.filter-btn', { hasText: 'PENDING' }).click()
    await page.waitForTimeout(300)
    const pendingCount = await page.locator('.booking-card').count()
    log('M4 Filter PENDING', 'ok', `${pendingCount} résa(s)`)

    await page.locator('.bottom-nav button', { hasText: 'Entree' }).click()
    await page.waitForTimeout(400)
    log('M5 Door checkin', 'ok', await snippet(page))

    // Phone search (avant QR pour garder le formulaire visible)
    await page.locator('.phone-search input').pressSequentially('666111111', { delay: 30 })
    await page.waitForTimeout(200)
    const phoneBtn = page.locator('.phone-search button')
    if (await phoneBtn.count()) {
      await phoneBtn.click()
    }
    await page.waitForTimeout(300)
    const phoneShowsResult = (await page.locator('.checkin-result').count()) > 0
    const phoneClearedOnly = !phoneShowsResult && (await page.locator('.phone-search input').inputValue()) === ''
    log('M5 Phone search', phoneShowsResult ? 'ok' : 'fail',
      phoneShowsResult ? 'résultat affiché' : phoneClearedOnly ? 'bug: efface le champ sans afficher le client' : 'aucun effet')

    // QR paste
    await page.locator('.qr-scanner input').evaluate((el) => {
      const event = new Event('paste', { bubbles: true })
      Object.defineProperty(event, 'clipboardData', {
        value: { getData: () => 'LAY-ABC123' },
      })
      el.dispatchEvent(event)
    })
    await page.waitForTimeout(400)
    const hasCheckinResult = (await page.locator('.checkin-result').count()) > 0
    log('M5 QR lookup LAY-ABC123', hasCheckinResult ? 'ok' : 'warn', hasCheckinResult ? 'client trouvé' : 'nécessite vrai paste ou scan caméra')

    await page.getByRole('button', { name: /Annuler/i }).click()
    await page.waitForTimeout(300)

    // Dashboard nav bug
    await page.locator('.bottom-nav button').first().click()
    await page.waitForTimeout(400)
    const afterDashNav = await snippet(page)
    const stuckInPro = afterDashNav.includes('Sky') || afterDashNav.includes('Arrivés') || afterDashNav.includes('Aujourd')
    const leakedToClient = afterDashNav.includes('Trouver votre accès') || afterDashNav.includes('Casablanca')
    log('M6 Nav Tableau de bord', leakedToClient ? 'fail' : stuckInPro ? 'ok' : 'warn', afterDashNav.slice(0, 80))

    // Logout
    await page.locator('.bottom-nav button', { hasText: 'Logout' }).click()
    await page.waitForTimeout(400)
    const afterLogout = await snippet(page)
    log('M7 Logout', afterLogout.includes('Trouver') || afterLogout.includes('Layali') ? 'ok' : 'warn', afterLogout.slice(0, 60))

    // Customer path on pro-login
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Manager/i }).click()
    await page.getByRole('button', { name: /Je suis client/i }).click()
    await page.waitForTimeout(300)
    await page.locator('form ion-button').first().click()
    await page.waitForTimeout(500)
    const customerLoginResult = await snippet(page)
    const customerBug = customerLoginResult.includes('Sky') || customerLoginResult.includes('OWNER')
    log('M8 Login client via pro-login', customerBug ? 'fail' : 'ok',
      customerBug ? 'connecte en manager au lieu de client' : 'pas de fuite manager')

    const failed = results.filter((r) => r.status === 'fail').length
    const warned = results.filter((r) => r.status === 'warn').length
    console.log('\n══════════════════════════════════════')
    console.log(`Manager : ${results.length} checks | ${failed} échecs | ${warned} avertissements`)
    console.log(`URL : ${BASE}`)
    console.log('══════════════════════════════════════\n')
    results.filter((r) => r.status !== 'ok').forEach((r) => {
      console.log(`  [${r.status.toUpperCase()}] ${r.step}: ${r.detail}`)
    })
    if (failed) process.exitCode = 1
  } catch (err) {
    log('Erreur fatale', 'fail', err.message)
    console.error(err)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

run()
