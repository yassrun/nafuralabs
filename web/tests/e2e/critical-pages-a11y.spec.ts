import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * 9 pages clés — alignées sur `docs/specs/erp-audit-roadmap/14-tests-audit.md` (Task 14.4).
 */
const CRITICAL_PAGES: { path: string; name: string }[] = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/chantiers', name: 'Chantiers listing' },
  { path: '/chantiers/ch-003', name: 'Chantier détail' },
  { path: '/achats/commandes', name: 'Achats BC' },
  { path: '/marches/factures', name: 'Marchés factures' },
  { path: '/finance/journaux', name: 'Finance journaux' },
  { path: '/rh/employes', name: 'RH employés' },
  { path: '/hse/incidents', name: 'HSE incidents' },
  { path: '/admin', name: 'Admin hub' },
  { path: '/administration/members', name: 'Admin membres' },
];

test.describe('WCAG axe — pages clés (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const { path, name } of CRITICAL_PAGES) {
    test(`${name} (${path}) — no critical or serious violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      expect.soft(blocking).toEqual([]);
    });
  }
});
