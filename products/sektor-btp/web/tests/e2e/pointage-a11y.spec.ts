import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Pointage accessibility', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('has no critical or serious axe violations on the mobile pointage page', async ({ page }) => {
    await page.goto('/rh/pointage/saisie');
    await page.locator('#pointage-chantier').selectOption({ index: 1 });

    const results = await new AxeBuilder({ page }).analyze();
    const blockingViolations = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    );

    expect(blockingViolations).toEqual([]);
  });
});