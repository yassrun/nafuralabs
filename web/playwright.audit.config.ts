import { defineConfig } from '@playwright/test';
import * as path from 'node:path';

const authFile = path.resolve(__dirname, 'tests/e2e/.auth/erp-audit.json');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://erp.nafura.local',
    trace: 'off',
    screenshot: 'off',
    ignoreHTTPSErrors: true,
    navigationTimeout: 15_000,
  },
  projects: [
    { name: 'setup', testMatch: /erp-audit-auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: /erp-audit-auth\.setup\.ts/,
    },
  ],
});
