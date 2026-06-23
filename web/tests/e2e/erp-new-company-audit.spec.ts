/**
 * Audit smoke — crawl sidebar routes on erp.nafura.local
 * Delegates to scripts/crawl-erp-routes.mjs (Playwright test runner adds overhead on some SPA routes).
 */
import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT_DIR = path.resolve(__dirname, '../../../docs/qa/erp-audit-2026-06-13');
const OUT_FILE = path.join(OUT_DIR, 'route-audit-results.json');
const CRAWL_SCRIPT = path.resolve(__dirname, 'scripts/crawl-erp-routes.mjs');

test.describe('ERP new-company audit', () => {
  test.describe.configure({ timeout: 120_000 });

  test('crawl sidebar routes', () => {
    execFileSync(process.execPath, [CRAWL_SCRIPT], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit',
      env: process.env,
    });

    const results = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8')) as {
      path: string;
      sessionLost: boolean;
    }[];

    const lost = results.filter((r) => r.sessionLost);
    expect(results.length).toBeGreaterThanOrEqual(38);
    expect(lost, `Session lost on: ${lost.map((r) => r.path).join(', ')}`).toHaveLength(0);
  });
});
