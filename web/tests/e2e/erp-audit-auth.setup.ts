import { expect, test as setup } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { AUTH_FILE, ensureLoggedIn } from './lib/erp-auth.helper';

setup('authenticate ERP audit user', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await ensureLoggedIn(page);
  await expect(page).not.toHaveURL(/\/login/);

  const state = await page.context().storageState();
  if (!state.cookies.length && !state.origins.some((o) => o.localStorage.length)) {
    throw new Error('Auth setup did not capture session cookies or localStorage');
  }

  await page.context().storageState({ path: AUTH_FILE });
});
