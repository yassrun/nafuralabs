import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://127.0.0.1:4303/';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
await page.waitForTimeout(8000);

const root = await page.evaluate(() => ({
  html: document.querySelector('app-root')?.innerHTML?.slice(0, 400) || 'empty',
  ngVersion: document.querySelector('app-root')?.getAttribute('ng-version') || null,
  childCount: document.querySelector('app-root')?.childElementCount ?? 0,
  text: document.body?.innerText?.slice(0, 200) || 'empty',
}));

console.log('URL:', page.url());
console.log('ERRORS:', errors.length ? errors : 'none');
console.log('ROOT:', JSON.stringify(root, null, 2));

await browser.close();
process.exit(errors.length ? 1 : 0);
