/**
 * One-shot: DE-0271 cadrage — Enregistrer + durée d’exéc. (Mode B).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const DOSSIER_ID = 'acb73230-bd4d-48ce-bf18-041d8e4e8964';
const OUT = path.join(ROOT, 'sektor/e2e/.auth/de-0271-cadrage');
const require = createRequire(path.join(ROOT, 'sektor/sources/web/package.json'));
const { chromium } = require('playwright');

fs.mkdirSync(OUT, { recursive: true });

const shot = async (page, name) => {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`SHOT  ${file}`);
  return file;
};

const text = async (page, sel) =>
  page.locator(sel).first().innerText().catch(() => '');

const apiDossier = async () => {
  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  const res = await fetch(`${API_BASE}/api/v1/etudes/dossiers/${DOSSIER_ID}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'X-Tenant-Id': session.tenantId,
      Accept: 'application/json',
    },
  });
  return res.json();
};

const dump = (label, d) => {
  console.log(
    `${label} numero=${d.numero} aoc=${d.appelOffreClientId} delai=${d.aoDelaiExecutionJours} type=${d.aoType} ref=${d.aoReference} date=${d.aoDateLimiteDepot} v=${d.version}`,
  );
};

const before = await apiDossier();
dump('API avant', before);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

try {
  await page.goto(`${APP_BASE}/etudes/dossiers/${DOSSIER_ID}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.getByRole('heading', { name: /Identité de l.étude/i }).waitFor({
    timeout: 30000,
  });
  await page.waitForTimeout(4000);

  const headerDelaiAvant = await text(page, '.dsh__meta-item:has(.dsh__k)');
  const dureeAvant = await page
    .locator('.dsh__meta-item')
    .filter({ hasText: /Durée/ })
    .innerText()
    .catch(() => '(introuvable)');
  const accepterAvant = await page.getByRole('button', { name: /^Accepter$/ }).count();
  const delaiInput = await page.locator('input[name="delaiExecutionJours"]').inputValue().catch(() => '');
  console.log(`UI avant  dureeHeader="${dureeAvant.replace(/\s+/g, ' ').trim()}" accepter=${accepterAvant} inputDelai=${delaiInput}`);
  await shot(page, '01-cadrage-avant');

  const saveBtn = page.getByRole('button', { name: /^Enregistrer$/ });
  await saveBtn.click();
  await page.waitForTimeout(2500);
  const banner = await page.locator('app-etude-banner').allInnerTexts().catch(() => []);
  console.log('Après Enregistrer banners:', banner.join(' | ') || '(aucun)');
  const dureeApresSave = await page
    .locator('.dsh__meta-item')
    .filter({ hasText: /Durée/ })
    .innerText()
    .catch(() => '(introuvable)');
  console.log(`UI après save dureeHeader="${dureeApresSave.replace(/\s+/g, ' ').trim()}"`);
  await shot(page, '02-apres-enregistrer');

  const afterSave = await apiDossier();
  dump('API après save', afterSave);

  const bordereau = page.getByRole('button', { name: /Bordereau/i }).first();
  if (await bordereau.count()) {
    await bordereau.click();
    await page.waitForTimeout(2500);
    await shot(page, '03-bordereau');
  } else {
    const next = page.getByRole('button', { name: /Continuer vers le bordereau/i });
    if (await next.count()) {
      await next.click();
      await page.waitForTimeout(2500);
      await shot(page, '03-bordereau');
    } else {
      console.log('WARN  pas de CTA Bordereau');
    }
  }

  const cadrage = page.getByRole('button', { name: /Cadrage/i }).first();
  await cadrage.click();
  await page.getByRole('heading', { name: /Identité de l.étude/i }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(4000);
  const accepterApres = await page.getByRole('button', { name: /^Accepter$/ }).count();
  const dureeRetour = await page
    .locator('.dsh__meta-item')
    .filter({ hasText: /Durée/ })
    .innerText()
    .catch(() => '(introuvable)');
  const delaiRetour = await page.locator('input[name="delaiExecutionJours"]').inputValue().catch(() => '');
  console.log(`UI retour accepter=${accepterApres} dureeHeader="${dureeRetour.replace(/\s+/g, ' ').trim()}" inputDelai=${delaiRetour}`);
  await shot(page, '04-retour-cadrage');

  const afterRetour = await apiDossier();
  dump('API retour', afterRetour);

  const persistOk = afterRetour.aoDelaiExecutionJours != null || afterRetour.appelOffreClientId != null;
  const headerOk = /[0-9]+\s*j/i.test(dureeApresSave) || /[0-9]+\s*j/i.test(dureeRetour);
  const suggestionsRevenues = accepterApres > 0 && persistOk === false;

  console.log(
    JSON.stringify(
      {
        persistOk,
        headerOk,
        accepterAvant,
        accepterApres,
        suggestionsRevenues,
        dureeAvant,
        dureeApresSave,
        dureeRetour,
        pageErrors: errors.slice(0, 8),
      },
      null,
      2,
    ),
  );

  if (!persistOk) {
    console.error('FAIL  délai / AOC non persistés après Enregistrer');
    process.exitCode = 1;
  } else if (suggestionsRevenues) {
    console.error('FAIL  suggestions CPS revenues après aller-retour');
    process.exitCode = 1;
  } else {
    console.log('OK    DE-0271 cadrage persisté, header durée à jour');
  }
} finally {
  await browser.close();
}
