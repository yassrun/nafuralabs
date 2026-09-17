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

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await context.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'nafura-onboarding' || String(key).startsWith('nafura-tour-seen-')) return '1';
      return get.call(this, key);
    };
  });
  await context.route('**/nominatim.openstreetmap.org/**', async (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname.includes('/reverse')
      ? {
          lat: '34.0209',
          lon: '-6.8416',
          display_name: 'Avenue Mohammed V, Rabat, Maroc',
          address: { road: 'Avenue Mohammed V', city: 'Rabat', house_number: '12' },
        }
      : [
          {
            lat: '34.0209',
            lon: '-6.8416',
            display_name: 'Avenue Mohammed V, Rabat, Maroc',
            address: { road: 'Avenue Mohammed V', city: 'Rabat' },
          },
        ];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4200/chantiers/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('heading', { name: 'Cadrage et documents' }).waitFor({ timeout: 60000 });

  assert.ok(await page.getByRole('heading', { name: 'Identité du chantier' }).isVisible());
  assert.ok(await page.getByText('Type de chantier').isVisible());
  assert.ok(await page.getByText('Description', { exact: true }).isVisible());
  assert.ok(await page.getByRole('heading', { name: 'Localisation' }).isVisible());
  assert.ok(await page.locator('nf-map-picker').isVisible());
  assert.ok(await page.getByRole('button', { name: 'Localiser' }).isVisible());
  const viewport = page.locator('nf-map-picker .nf-map-picker__viewport');
  const box = await viewport.boundingBox();
  assert.ok(box, 'map viewport');
  assert.ok(box.height <= 220, `map height ${box.height}`);
  const localisation = page.locator('nf-map-picker');
  const locBox = await localisation.boundingBox();
  assert.ok(locBox && locBox.height <= 420, `localisation block ${locBox?.height}`);
  const tile = page.locator('nf-map-picker .nf-map-picker__tile').first();
  await tile.waitFor({ timeout: 10000 });
  await page.waitForFunction(() => {
    const img = document.querySelector('nf-map-picker .nf-map-picker__tile');
    return !!img && img.naturalWidth >= 256;
  }, { timeout: 15000 }).catch(() => {});
  const tileBox = await tile.boundingBox();
  assert.ok(tileBox && Math.abs(tileBox.width - 256) < 1, `tile width ${tileBox?.width} (reset max-width?)`);
  const natural = await tile.evaluate((el) => el.naturalWidth);
  assert.ok(natural >= 256, `OSM tiles must paint, naturalWidth=${natural}`);
  assert.ok(await page.getByText(/Cliquez la carte/).isVisible());
  assert.ok(await page.getByLabel('Lat').isVisible());
  assert.ok(await page.getByLabel('Lng').isVisible());

  const map = page.locator('nf-map-picker .nf-map-picker__viewport');
  await map.click({ position: { x: 200, y: 90 } });
  await page.waitForFunction(() => {
    const lat = document.querySelector('nf-map-picker input[type="number"]');
    return lat && String(lat.value).length > 0;
  }, { timeout: 15000 });
  const latBefore = await page.locator('nf-map-picker input[type="number"]').first().inputValue();
  const lngBefore = await page.locator('nf-map-picker input[type="number"]').nth(1).inputValue();
  assert.ok(Number(latBefore) !== 0, `lat ${latBefore}`);
  assert.ok(Number(lngBefore) !== 0, `lng ${lngBefore}`);
  await page.waitForFunction(() => {
    const input = document.querySelector('nf-map-picker .nf-input-field');
    return !!input && /Avenue Mohammed V|Rabat/i.test(input.value);
  }, { timeout: 10000 });
  await page.screenshot({ path: out + 'cadrage-identite-map.png', animations: 'disabled' });

  const studyField = page.getByRole('combobox', { name: /Étude \(facultatif\)/ });
  await studyField.click();
  await studyField.fill('Nouvelle');
  await page.getByRole('option').first().waitFor({ timeout: 15000 });
  page.once('dialog', (d) => d.accept());
  await page.getByRole('option').first().click();
  await page.getByText(/Étude choisie|Préremplissage/).waitFor({ timeout: 20000 });
  await page.getByText(/Étude choisie/).waitFor({ timeout: 20000 }).catch(() => {});
  const latAfter = await page.locator('nf-map-picker input[type="number"]').first().inputValue();
  const lngAfter = await page.locator('nf-map-picker input[type="number"]').nth(1).inputValue();
  assert.equal(latAfter, latBefore, 'study prefill must not overwrite lat');
  assert.equal(lngAfter, lngBefore, 'study prefill must not overwrite lng');
  await page.screenshot({ path: out + 'cadrage-identite-etude.png', animations: 'disabled' });

  await page.goto('http://127.0.0.1:4200/chantiers/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('heading', { name: 'Cadrage et documents' }).waitFor({ timeout: 60000 });
  assert.ok(await page.getByText(/Cliquez la carte/).isVisible());
  const emptyLat = await page.locator('nf-map-picker input[type="number"]').first().inputValue();
  assert.equal(emptyLat, '', 'sans étude: pas de pin');
  await page.screenshot({ path: out + 'cadrage-identite-sans-etude.png', animations: 'disabled' });

  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('cadrage identité + map picker OK', { latBefore, lngBefore });
} finally {
  await browser.close();
}
