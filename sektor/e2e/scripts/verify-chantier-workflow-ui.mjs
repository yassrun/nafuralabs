// UI contract with mocked APIs; server business rules have their own JUnit coverage.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../sources/web/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const out = fileURLToPath(new URL('../../../.angular/chantier-workflow-qa/', import.meta.url));
await mkdir(out, { recursive: true });
const study = { id: 'study-ui', numero: 'DE-0042', objet: 'Résidence Atlas', clientId: 'client-ui', clientNom: 'Client Atlas', status: 'FINANCIALLY_APPROVED', aoVille: 'Rabat', currentStep: 5, version: 1 };
const payload = { sub: 'user-ui', exp: Math.floor(Date.now()/1000)+3600, tenant_id: 'tenant-ui', iss: 'nafura-onboarding', email: 'qa@nafuralabs.local' };
const token = [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'), Buffer.from(JSON.stringify(payload)).toString('base64url'), 'fixture'].join('.');
const browser = await chromium.launch({ executablePath: process.env.PW_EXECUTABLE_PATH ?? 'C:/Users/yassiveco/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) { if (key === 'nafura-onboarding' || key.startsWith('nafura-tour-seen-')) return '1'; return get.call(this, key); };
  });
  const creations = [], studySearches = [], documents = [];
  let transitions = 0, conversions = 0, uploads = 0, failCps = true, current;
  await context.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname, post = request.method() === 'POST';
    let body = [];
    if (path.endsWith('/cursor-session')) body = { accessToken: token, expiresIn: 3600, userId: 'user-ui', email: 'qa@nafuralabs.local', firstName: 'QA', lastName: 'Local', tenantId: 'tenant-ui', tenantName: 'QA Local', tenantSlug: 'qa-local', superAdmin: true };
    else if (path.endsWith('/convertir')) { conversions++; body = {}; }
    else if (path.endsWith('/etudes/dossiers/study-ui')) body = study;
    else if (path.endsWith('/etudes/dossiers')) { studySearches.push(url.searchParams.get('status')); body = { items: [study, { ...study, id: 'draft-study', numero: 'INTERDIT', status: 'BROUILLON' }], total: 2 }; }
    else if (path.endsWith('/partners')) body = [{ id: 'client-ui', code: 'CLI-01', raisonSociale: 'Client Atlas' }];
    else if (path.endsWith('/attachments/upload')) { uploads++; body = { id: 'file-'+uploads, fileUrl: 'storage/file-'+uploads }; }
    else if (path.endsWith('/documents') && path.includes('/chantiers/chantier-ui')) {
      if (post) {
        const data = request.postDataJSON();
        if (data.tags.includes('CPS_SIGNE') && failCps) { failCps = false; await route.fulfill({ status: 503, json: { message: 'Simulated failure' } }); return; }
        body = { ...data, id: 'doc-'+(documents.length+1), chantierId: current.chantier.id };
        documents.push(body);
      } else body = documents.filter(d => d.chantierId === current.chantier.id);
    }
    else if (path.endsWith('/workflow')) { if (post) transitions++; body = current; }
    else if (path.endsWith('/chantiers') && post) {
      const data = request.postDataJSON(); creations.push(data);
      body = { ...data, id: 'chantier-ui-'+creations.length, code: 'CH-00'+creations.length };
      current = { chantier: body, revision: 0, data: { history: [], reserves: [], garanties: [] }, blockers: ['responsables', 'dates_prevues'], availableActions: ['SAVE_PREPARATION', 'VALIDATE_PREPARATION', 'CANCEL', 'ADD_GARANTIE', 'UPDATE_GARANTIE'], canEdit: true };
    }
    else if (path.endsWith('/onboarding/state')) body = { completed: true };
    await route.fulfill({ json: body });
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = process.env.WORKFLOW_UI_URL ?? 'http://127.0.0.1:4300/chantiers/new';
  await page.goto(base);
  await page.getByRole('heading', { name: 'Documents du chantier', exact: true }).waitFor({ timeout: 60000 });
  assert.equal(studySearches.length, 0, 'No study listing loaded on entry');
  await page.screenshot({ path: out + 'onboarding-documents-desktop.png', animations: 'disabled' });
  await page.getByRole('button', { name: /^Étude \(facultatif\)/ }).click();
  await page.getByRole('button', { name: 'Continuer sans étude', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom du chantier', exact: true }).fill('Chantier sans étude');
  await page.getByRole('combobox', { name: 'Client', exact: false }).fill('Atlas');
  await page.getByRole('option', { name: /Client Atlas/ }).click();
  await page.getByRole('textbox', { name: 'Ville', exact: true }).fill('Casablanca');
  await page.getByRole('button', { name: 'Enregistrer la préparation', exact: true }).click();
  await page.waitForURL('**/chantiers/chantier-ui-1/workflow');
  assert.equal(creations.length, 1);
  assert.equal(creations[0].label, 'Chantier sans étude');
  assert.equal(creations[0].dossierEtudeId, undefined);
  assert.equal(studySearches.length, 0, 'Creation without study never calls the studies API');
  await page.getByRole('button', { name: 'Garanties & clôture', exact: true }).click();
  await page.getByRole('heading', { name: 'Garanties & clôture', exact: true }).waitFor();
  assert.equal(transitions, 0, 'Navigation never changes lifecycle');
  assert.equal(await page.locator('.nf-wizard-shell__step--completed').count(), 0);
  await page.screenshot({ path: out + 'workflow-garanties-desktop.png', animations: 'disabled' });
  // Prefill remains editable, has no conversion side effect, and only eligible studies are returned.
  await page.goto(base);
  await page.getByRole('heading', { name: 'Documents du chantier', exact: true }).waitFor();
  for (const label of ['Marché signé', 'CPS signé']) await page.getByLabel(label, { exact: true }).setInputFiles({ name: label+'.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await page.getByRole('button', { name: /^Étude \(facultatif\)/ }).click();
  await page.getByRole('combobox', { name: 'Étude (facultatif)' }).fill('Atlas');
  await page.getByRole('option', { name: /DE-0042/ }).click();
  await expect(page.getByText(/Les champs préremplis restent modifiables/)).toBeVisible();
  assert.ok(studySearches.length > 0 && studySearches.every(s => s === 'FINANCIALLY_APPROVED'));
  assert.equal(await page.getByRole('option', { name: /INTERDIT/ }).count(), 0);
  assert.equal(creations.length, 1, 'Prefill did not create a chantier');
  await page.screenshot({ path: out + 'onboarding-source-desktop.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nom du chantier', exact: true })).toHaveValue('Résidence Atlas');
  await expect(page.getByRole('textbox', { name: 'Ville', exact: true })).toHaveValue('Rabat');
  await page.getByRole('textbox', { name: 'Nom du chantier', exact: true }).fill('Atlas — chantier');
  await page.getByRole('button', { name: 'Enregistrer la préparation', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Le chantier a été créé' })).toBeVisible();
  assert.equal(creations.length, 2);
  assert.equal(documents.length, 1, 'First successful document is retained after second upload fails');
  await page.getByRole('button', { name: 'Enregistrer les documents', exact: true }).click();
  await page.waitForURL('**/chantiers/chantier-ui-2/workflow');
  assert.equal(creations.length, 2, 'Retry never creates a second chantier');
  assert.equal(documents.length, 2);
  assert.equal(uploads, 2, 'Retry reuses the already uploaded file');
  assert.equal(conversions, 0, 'Prefill must never convert or mutate the study');
  await page.getByRole('button', { name: 'Documents', exact: true }).click();
  await expect(page.getByText('Document enregistré', { exact: true })).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: out + 'workflow-mobile.png', animations: 'disabled' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log('UI passed: optional study, filtered lookup, editable prefill, signed document uploads, partial failure retry, unique creation, lifecycle navigation, mobile. APIs mocked.');
} finally { await browser.close(); }
