import { expect, type APIRequestContext, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
/** Matches ApiConfigService: erp.nafura.local → api.erp.nafura.local */
export const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

export type SessionContext = {
  accessToken: string;
  tenantId: string | null;
};

export async function isErpAuthenticated(page: Page): Promise<boolean> {
  return page
    .getByRole('heading', { name: /tableau de bord|dashboard|mes chantiers|nouveau/i })
    .first()
    .isVisible()
    .catch(() => false);
}

export async function completeKeycloakLogin(page: Page): Promise<void> {
  await page.waitForSelector('input[name="username"], #username', { timeout: 15000 });
  await page.fill('input[name="username"], #username', 'yassine.karkafi@gmail.com');
  await page.fill('input[name="password"], #password', '123');
  await page.getByRole('button', { name: /sign in|connexion|se connecter/i }).click();
}

/** QA runs against fr-MA UI; persisted ar/en breaks French title/column assertions. */
export async function ensureFrenchLocale(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('seyrura:language', 'fr');
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  });
}

/** Persist FR in user settings so loadRemoteLanguagePreference() does not revert to AR. */
export async function ensureFrenchLocaleRemote(
  page: Page,
  request?: APIRequestContext,
): Promise<void> {
  await ensureFrenchLocale(page);
  const session = await getSessionContext(page);
  if (!session) return;

  const ctx =
    request ??
    page.context().request;
  const res = await ctx.get(`${API_BASE}/api/v1/user-settings/preferences`, {
    headers: apiHeaders(session),
  });
  if (!res.ok()) return;

  const current = (await res.json()) as {
    locale?: string | null;
    timezone?: string | null;
    theme?: string | null;
    dateFormat?: string | null;
  };
  if (current.locale?.toLowerCase() === 'fr') return;

  await ctx.put(`${API_BASE}/api/v1/user-settings/preferences`, {
    headers: apiHeaders(session),
    data: {
      locale: 'fr',
      timezone: current.timezone ?? 'UTC',
      theme: current.theme ?? 'system',
      dateFormat: current.dateFormat ?? 'YYYY-MM-DD',
    },
  });
}

export async function ensureLoggedIn(
  page: Page,
  landing = '/dashboard',
  waitUntil: 'domcontentloaded' | 'networkidle' = 'networkidle',
): Promise<void> {
  await page.goto(landing, { waitUntil, timeout: 30000 });
  await ensureFrenchLocale(page);
  await page.reload({ waitUntil, timeout: 30000 });
  await page.waitForTimeout(waitUntil === 'networkidle' ? 1500 : 400);

  if (await isErpAuthenticated(page)) {
    await ensureFrenchLocaleRemote(page);
    await page.reload({ waitUntil, timeout: 30000 });
    await page.waitForTimeout(400);
    return;
  }

  if (page.url().includes('iam.nafura.local')) {
    await completeKeycloakLogin(page);
    await page.waitForURL(/erp\.nafura\.local/, { timeout: 45000 });
  } else {
    const sso = page.getByRole('button', { name: /connexion sécurisée|sso/i });
    if (await sso.isVisible().catch(() => false)) {
      await sso.click();
      await page.waitForURL(/iam\.nafura\.local/, { timeout: 30000 });
      await completeKeycloakLogin(page);
      await page.waitForURL(/erp\.nafura\.local/, { timeout: 45000 });
    }
  }

  await page.waitForSelector('h1', { timeout: 60000 });
  await expect(page.locator('h1').first()).toBeVisible();
  await ensureFrenchLocaleRemote(page);
  await page.reload({ waitUntil, timeout: 30000 });
  await page.waitForTimeout(400);
}

export function uniqueSuffix(): string {
  return Date.now().toString(36).slice(-6);
}

export async function getSessionContext(page: Page): Promise<SessionContext | null> {
  return page.evaluate(() => {
    const raw =
      localStorage.getItem('pf_session') ??
      sessionStorage.getItem('pf_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      tokens?: { accessToken?: string };
      tenantId?: string | null;
    };
    if (!parsed.tokens?.accessToken) return null;
    return { accessToken: parsed.tokens.accessToken, tenantId: parsed.tenantId ?? null };
  });
}

export function apiHeaders(session: SessionContext): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  };
  if (session.tenantId) {
    headers['X-Tenant-Id'] = session.tenantId;
  }
  return headers;
}

export async function apiPost(
  request: APIRequestContext,
  session: SessionContext,
  path: string,
  data: unknown,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await request.post(`${API_BASE}${path}`, { headers: apiHeaders(session), data });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => null);
  }
  return { ok: res.ok(), status: res.status(), body };
}
