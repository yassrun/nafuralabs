import { chromium } from 'playwright';

const url = process.argv[2] || 'http://sektor.nafuralabs.staging/chantiers/ch-001?tab=lots';
const email = process.argv[3];
const password = process.argv[4];

if (!email || !password) {
  console.error('Usage: node login-test.mjs <url> <email> <password>');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ignoreHTTPSErrors: true });

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
} catch (e) {
  console.log('goto error:', e.message);
}

await page.waitForTimeout(3000);
console.log('URL after initial load:', page.url());

if (page.url().includes('iam.nafuralabs.staging')) {
  console.log('On IAM login page');
  const user = page.locator('input[name="username"], input#username, input[type="email"], input[type="text"]').first();
  const pass = page.locator('input[name="password"], input#password, input[type="password"]').first();
  await user.waitFor({ state: 'visible', timeout: 15000 });
  await user.fill(email);
  await pass.fill(password);
  const submit = page.locator('input[type="submit"], button[type="submit"], button:has-text("Connexion"), button:has-text("Sign in"), button:has-text("Log in")').first();
  await submit.click();
  await page.waitForTimeout(10000);
}

if (page.url().includes('/login') && !page.url().includes('iam.')) {
  console.log('On app login page');
  const loginBtn = page.locator('button:has-text("Connexion"), button:has-text("Se connecter"), a:has-text("Connexion")').first();
  if (await loginBtn.isVisible().catch(() => false)) {
    await loginBtn.click();
    await page.waitForTimeout(5000);
  }
}

if (page.url().includes('iam.nafuralabs.staging')) {
  const user = page.locator('input[name="username"], input#username, input[type="email"], input[type="text"]').first();
  if (await user.isVisible().catch(() => false)) {
    await user.fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('input[type="submit"], button[type="submit"], button:has-text("Connexion")').first().click();
    await page.waitForTimeout(10000);
  }
}

console.log('Final URL:', page.url());
console.log('Title:', await page.title());
const bodyText = await page.locator('body').innerText().catch(() => '');
console.log('Body preview:', bodyText.slice(0, 500).replace(/\s+/g, ' '));
console.log('Has app-root content:', await page.evaluate(() => {
  const r = document.querySelector('app-root');
  return r ? r.innerHTML.length : -1;
}));
console.log('NG0203:', logs.some((l) => l.includes('NG0203')));
console.log('Mixed content:', logs.some((l) => l.toLowerCase().includes('mixed content')));
const authFailed = bodyText.toLowerCase().includes('authentication failed') || bodyText.toLowerCase().includes('échec');
console.log('Auth failed message:', authFailed);
if (logs.length) {
  console.log('--- console ---');
  console.log(logs.slice(-15).join('\n'));
}

await browser.close();
