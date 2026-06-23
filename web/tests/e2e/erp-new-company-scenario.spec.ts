/**
 * Scénario nouvelle entreprise — référentiels minimum + chantier via API + vérif UI.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  AUTH_FILE,
  apiPost,
  ensureLoggedIn,
  getSessionContext,
  uniqueSuffix,
} from './lib/erp-auth.helper';

type StepResult = { step: string; status: 'pass' | 'fail'; detail: string };
const steps: StepResult[] = [];

function record(step: string, status: StepResult['status'], detail: string): void {
  steps.push({ step, status, detail });
}

test.describe.serial('ERP new-company scenario', () => {
  test.describe.configure({ timeout: 600_000 });

  test('B3–C1 créer dépôt, fournisseur, client, chantier', async ({ browser, request }) => {
    const suffix = uniqueSuffix();
    const context = await browser.newContext({
      storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    try {
      await ensureLoggedIn(page);
      const session = await getSessionContext(page);
      expect(session, 'pf_session missing after login').not.toBeNull();
      const auth = session!;

      const depot = await apiPost(request, auth, '/api/v1/locations', {
        code: `DEP-${suffix}`,
        name: `Dépôt QA ${suffix}`,
        type: 'WAREHOUSE',
        isPhysical: true,
        affectsStock: true,
      });
      record('B3-depot', depot.ok ? 'pass' : 'fail', `POST locations → ${depot.status}`);
      expect(depot.ok, JSON.stringify(depot.body)).toBe(true);

      const fournisseur = await apiPost(request, auth, '/api/v1/partners', {
        code: `FRN-${suffix}`,
        raisonSociale: `Fournisseur QA ${suffix}`,
        ice: '001234567890123',
        roles: ['FOURNISSEUR'],
      });
      record('B5-fournisseur', fournisseur.ok ? 'pass' : 'fail', `POST partner FOURNISSEUR → ${fournisseur.status}`);
      expect(fournisseur.ok, JSON.stringify(fournisseur.body)).toBe(true);

      const client = await apiPost(request, auth, '/api/v1/partners', {
        code: `CLI-${suffix}`,
        raisonSociale: `Client QA ${suffix}`,
        roles: ['CLIENT'],
      });
      record('B6-client', client.ok ? 'pass' : 'fail', `POST partner CLIENT → ${client.status}`);
      expect(client.ok, JSON.stringify(client.body)).toBe(true);

      const clientId = (client.body as { id?: string })?.id ?? '';
      const today = new Date().toISOString().slice(0, 10);
      const end = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);

      const chantier = await apiPost(request, auth, '/api/v1/chantiers', {
        label: `Chantier QA ${suffix}`,
        clientId,
        clientName: `Client QA ${suffix}`,
        ville: 'Casablanca',
        chantierType: 'BATIMENT',
        dateDemarrage: today,
        dateFinPrevue: end,
        montantHt: 500000,
        tauxTva: 20,
        status: 'EN_COURS',
        chefChantierName: 'Chef QA',
        conducteurTravauxName: 'Conducteur QA',
        active: true,
      });
      record('C1-chantier', chantier.ok ? 'pass' : 'fail', `POST chantiers → ${chantier.status}`);
      expect(chantier.ok, JSON.stringify(chantier.body)).toBe(true);

      await page.goto('/inventory/mouvements/receptions', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const prereq = page.locator('.reception-prereq');
      const prereqVisible = await prereq.isVisible().catch(() => false);
      const prereqText = prereqVisible ? ((await prereq.textContent()) ?? '').slice(0, 300) : 'none';
      record(
        'C4-receptions',
        'pass',
        prereqVisible
          ? `Prerequisites (BC may still be missing): ${prereqText}`
          : 'No prerequisites banner — refs likely complete enough',
      );

      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);
      const enCoursLink = page.locator('a[href*="status=EN_COURS"]');
      const kpiText = (await enCoursLink.first().textContent().catch(() => '')) ?? '';
      const hasKpi = /\d/.test(kpiText) && !/^0\s*$/.test(kpiText.trim());
      record('D1-dashboard-kpi', hasKpi ? 'pass' : 'fail', `Chantiers en cours KPI: "${kpiText.trim()}"`);
      expect(hasKpi).toBe(true);

      await page.goto('/chantiers', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: /mes chantiers/i })).toBeVisible();
      await expect(page.locator('tbody').getByText(`Chantier QA ${suffix}`)).toBeVisible({ timeout: 10000 });
      record('C1-ui-listing', 'pass', `Chantier visible in listing`);
    } finally {
      const outDir = path.resolve(__dirname, '../../../docs/qa/erp-audit-2026-06-13');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'scenario-results.json'), JSON.stringify(steps, null, 2));
      await context.close();
    }

    const failed = steps.filter((s) => s.status === 'fail');
    expect(failed, failed.map((f) => `${f.step}: ${f.detail}`).join('\n')).toHaveLength(0);
  });
});
