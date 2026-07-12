import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://sektor.nafuralabs.staging/chantiers/ch-001?tab=lots', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);

if (page.url().includes('iam.nafuralabs.staging')) {
  await page.locator('input[name="username"], input#username').first().fill('yassine.karkafi@gmail.com');
  await page.locator('input[type="password"]').first().fill('Zflow19*$');
  await page.locator('input[type="submit"], button[type="submit"], button:has-text("Connexion")').first().click();
  await page.waitForTimeout(12000);
}

if (!page.url().includes('chantiers/ch-001')) {
  await page.goto('http://sektor.nafuralabs.staging/chantiers/ch-001?tab=lots', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
}

console.log('URL:', page.url());
console.log('Title:', await page.title());
const text = await page.locator('body').innerText();
console.log('Logged in:', text.includes('Yassine Karkafi') || text.includes('YK'));
console.log('Chantier page:', page.url().includes('chantiers/ch-001'));
console.log('Preview:', text.slice(0, 400).replace(/\s+/g, ' '));

await browser.close();
