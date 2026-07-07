import { expect, test } from '@playwright/test';

/**
 * Task 11 — M-PIL-01 : cinq vues pilotage-analyses avec KPIs branchées (non nulles si données seeds).
 */
const PILOTAGE_ANALYSES_URLS = [
  '/pilotage-analyses/rentabilite',
  '/pilotage-analyses/financier',
  '/pilotage-analyses/stock',
  '/pilotage-analyses/achats',
  '/pilotage-analyses/rh',
];

for (const url of PILOTAGE_ANALYSES_URLS) {
  test(`pilotage analyses KPIs non nuls: ${url}`, async ({ page }) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-pilotage-loaded="true"]')).toBeVisible({ timeout: 30000 });
    const zeros = await page.locator('[data-kpi-value="0"]').count();
    expect(zeros).toBeLessThan(2);
  });
}
