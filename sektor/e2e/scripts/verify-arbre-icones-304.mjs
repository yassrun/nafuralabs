/**
 * SEKTOR-304 — arbre bordereau : un chevron Lucide, plus d'icônes Material hors registry.
 *
 * Discrimination (rouge avant) :
 * - nf-tree-table interpolait expand_more/chevron_right dans un seul mat-icon (ligatures superposées)
 * - nf-button Lucide recevait unfold_more / unfold_less / subdirectory_arrow_right / refresh
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const require = createRequire(path.join(ROOT, 'sektor/sources/web/package.json'));
const { chromium } = require('playwright');

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

const TREE =
  'nafura-platform/sources/web/lib/anatomy/components/organisms/tree-table/tree-table.component.ts';
const ICONS = 'nafura-platform/sources/web/core/icons/app-lucide-icons.ts';
const BUTTON =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/button/button.component.ts';
const ARBRE =
  'sektor/sources/web/app/etudes/dossiers/components/bordereau-arbre/bordereau-arbre.component.html';
const DECOMPO =
  'sektor/sources/web/app/etudes/dossiers/components/poste-decomposition-panel/poste-decomposition-panel.component.html';

const tree = read(TREE);
const icons = read(ICONS);
const button = read(BUTTON);
const arbre = read(ARBRE);
const decompo = read(DECOMPO);

if (/<mat-icon>\{\{\s*row\.expanded \? 'expand_more'/.test(tree)) {
  fail('nf-tree-table still interpolates Material ligatures in one mat-icon');
}
if (!tree.includes('lucide-icon name="chevron-down"') || !tree.includes('lucide-icon name="chevron-right"')) {
  fail('nf-tree-table toggler must use separate lucide chevron-down / chevron-right');
}
if (/<mat-icon>/.test(tree)) {
  fail('nf-tree-table still contains mat-icon');
}

for (const name of ['UnfoldVertical', 'FoldVertical', 'CornerDownRight']) {
  if (!icons.includes(name)) fail(`APP_LUCIDE_ICONS missing ${name}`);
}

const aliases = button.slice(
  button.indexOf('LUCIDE_ICON_NAME_ALIASES'),
  button.indexOf('export class ButtonComponent'),
);
for (const [from, to] of [
  ['unfold_more', 'unfold-vertical'],
  ['unfold_less', 'fold-vertical'],
  ['subdirectory_arrow_right', 'corner-down-right'],
  ['refresh', 'refresh-cw'],
]) {
  if (!aliases.includes(`${from}: '${to}'`)) {
    fail(`nf-button alias missing ${from} → ${to}`);
  }
}

if (/icon="unfold_more"|icon="unfold_less"|icon="subdirectory_arrow_right"/.test(arbre)) {
  fail('bordereau-arbre still uses Material icon names on nf-button');
}
if (!arbre.includes('icon="unfold-vertical"') || !arbre.includes('icon="fold-vertical"')) {
  fail('bordereau-arbre must use lucide unfold-vertical / fold-vertical');
}
if (!arbre.includes('icon="corner-down-right"')) {
  fail('bordereau-arbre add-child must use lucide corner-down-right');
}

if (/icon="refresh"/.test(decompo) && !decompo.includes('icon="refresh-cw"')) {
  fail('poste-decomposition refresh must use lucide refresh-cw');
}

console.log('OK    SEKTOR-304 source: lucide chevrons; unfold/subdirectory/refresh registered');

async function seedDossierWithTree() {
  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (!sessionRes.ok) fail(`cursor-session ${sessionRes.status}`);
  const session = await sessionRes.json();
  const h = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const ing = await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h });
  const list = ing.ok ? await ing.json() : [];
  const created = await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      objet: `QA 304 arbre icones ${Date.now()}`,
      chargeEtudeUserId: list[0]?.userId ?? session.userId,
      clientNom: 'MOA QA 304',
    }),
  });
  if (created.status !== 201) fail(`create dossier ${created.status} ${await created.text()}`);
  const { id } = await created.json();
  const init = await fetch(`${API_BASE}/api/v1/etudes/dossiers/${id}/documents/init-bordereau-manuel`, {
    method: 'POST',
    headers: h,
  });
  if (!init.ok) fail(`init bordereau ${init.status} ${await init.text()}`);
  const { dpgfId } = await init.json();
  const lotRes = await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ type: 'LOT', code: 'R1', libelle: 'Lot 304' }),
  });
  if (lotRes.status !== 201) fail(`lot ${lotRes.status} ${await lotRes.text()}`);
  const lotId = (await lotRes.json()).id;
  const slRes = await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      type: 'SOUS_LOT',
      code: 'R1.01',
      libelle: 'Sous-lot 304',
      parentId: lotId,
    }),
  });
  if (slRes.status !== 201) fail(`sous-lot ${slRes.status} ${await slRes.text()}`);
  const etape = await fetch(`${API_BASE}/api/v1/etudes/dossiers/${id}/etape`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ etape: 2 }),
  });
  if (!etape.ok) fail(`etape ${etape.status} ${await etape.text()}`);
  return id;
}

async function smokeBrowser() {
  const probe = await fetch(APP_BASE).catch(() => null);
  if (!probe?.ok) {
    console.log('SKIP browser — Mode B front not up on', APP_BASE);
    return;
  }
  const dossierId = await seedDossierWithTree();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const iconErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /icon has not been provided/i.test(msg.text())) {
      iconErrors.push(msg.text());
    }
  });
  try {
    await page.goto(`${APP_BASE}/etudes/dossiers/${dossierId}`, {
      waitUntil: 'domcontentloaded',
    });
    const heading = page.getByRole('heading', { name: /Arbre du bordereau/i });
    await heading.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(800);
    if (iconErrors.length) {
      fail(`browser: missing Lucide icons\n  ${iconErrors.slice(0, 5).join('\n  ')}`);
    }
    const toggler = page.locator('.nf-tree-table__toggler:not(.nf-tree-table__toggler--leaf)').first();
    if (!(await toggler.count())) fail('browser: no expandable tree row');
    const lucide = await toggler.locator('lucide-icon').count();
    const mat = await toggler.locator('mat-icon').count();
    if (mat !== 0) fail(`browser: toggler still has mat-icon (${mat})`);
    if (lucide !== 1) fail(`browser: toggler must have exactly 1 lucide-icon, got ${lucide}`);
    console.log('OK    SEKTOR-304 browser: arbre visible, 0 missing icons, single lucide chevron');
  } finally {
    await browser.close();
  }
}

await smokeBrowser();
