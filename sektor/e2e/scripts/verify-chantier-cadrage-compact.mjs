import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../sources/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const out = fileURLToPath(new URL('../../../.angular/chantier-cadrage-qa/', import.meta.url));
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PW_EXECUTABLE_PATH ?? 'C:/Users/yassiveco/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
});
const studySearches = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'nafura-onboarding' || String(key).startsWith('nafura-tour-seen-')) return '1';
      return get.call(this, key);
    };
  });
  await context.route('**/api/v1/etudes/dossiers**', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET' && url.pathname.endsWith('/etudes/dossiers')) {
      studySearches.push(url.searchParams.get('status'));
    }
    await route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4200/chantiers/new', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Cadrage et documents' }).waitFor({ timeout: 60000 });

  const compact = page.locator('app-chantier-pieces');
  await compact.waitFor();
  assert.equal(await compact.locator('.pieces__zone').count(), 2, 'CPS and BDP as two compact rows');
  assert.ok(await compact.getByText('Requis', { exact: true }).count() >= 2);
  assert.ok(await compact.getByText('À déposer', { exact: true }).count() >= 2);
  assert.ok(await compact.getByText('Déposer le fichier').isVisible());
  assert.ok(await compact.getByText('Déposer un BDP').isVisible());
  assert.equal(await page.getByText('ou cliquez pour parcourir').count(), 0, 'no large dropzone subtitle');
  assert.ok(await compact.getByText('Autres documents').isVisible());
  assert.ok(await compact.getByText('0/3').isVisible());
  assert.ok(await compact.getByRole('button', { name: 'Ajouter' }).isVisible());

  await page.screenshot({ path: out + 'cadrage-compact.png', animations: 'disabled' });

  const studyField = page.getByRole('combobox', { name: /Étude \(facultatif\)/ });
  await studyField.click();
  await studyField.fill('Nouvelle');
  await page.getByRole('option', { name: /DE-0022/ }).waitFor({ timeout: 15000 });
  const options = await page.getByRole('option').allTextContents();
  assert.ok(options.some((t) => t.includes('DE-0022')));
  assert.ok(studySearches.length > 0 && studySearches.every((s) => s === 'FINAL_APPROVED'), `status filter: ${JSON.stringify(studySearches)}`);

  page.once('dialog', (d) => d.accept());
  await page.getByRole('option', { name: /DE-0022/ }).click();
  await page.getByText(/Étude choisie/).waitFor({ timeout: 15000 });
  assert.equal(await page.locator('.bdp-preview').count(), 0, 'no BDP table on cadrage');
  await page.screenshot({ path: out + 'cadrage-sans-bdp.png', animations: 'disabled' });

  await page.locator('.nf-wizard-shell__step', { hasText: 'BDP chiffré' }).click();
  await page.getByRole('heading', { name: 'BDP chiffré' }).waitFor({ timeout: 15000 });
  await page.locator('.bdp-preview').waitFor({ timeout: 20000 });
  const preview = page.locator('.bdp-preview');
  await page.screenshot({ path: out + 'bdp-arbre-lecture-seule.png', animations: 'disabled' });
  const previewText = (await preview.innerText()).replace(/\s+/g, ' ');
  console.log('bdp preview:', previewText);
  assert.ok(/lot/i.test(previewText), previewText);
  assert.ok(/ligne/i.test(previewText), previewText);
  assert.ok(/DH HT/.test(previewText), previewText);
  assert.ok(await preview.getByText(/xc|xwc|29/).first().isVisible(), previewText);
  assert.ok(await page.getByText(/Repris de l.étude/).isVisible());
  assert.equal(await page.getByRole('button', { name: /Ajouter un lot/i }).count(), 0, 'no add-lot on study tree');

  await page.goto('http://127.0.0.1:4200/chantiers/new', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Cadrage et documents' }).waitFor({ timeout: 60000 });
  assert.equal(await page.locator('.bdp-preview').count(), 0, 'no BDP table without study');
  await page.locator('.nf-wizard-shell__step', { hasText: 'BDP chiffré' }).click();
  await page.getByRole('heading', { name: 'BDP chiffré' }).waitFor({ timeout: 15000 });
  assert.equal(await page.locator('.bdp-preview').count(), 0, 'manual BDP has no study tree before cadrage');
  assert.ok(await page.getByText(/Enregistrez d.abord le cadrage/).isVisible());
  assert.equal(await page.getByRole('button', { name: /Ajouter un lot/i }).count(), 0);

  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('cadrage sans tableau BDP + étape BDP lecture seule / manuel OK');
} finally {
  await browser.close();
}
