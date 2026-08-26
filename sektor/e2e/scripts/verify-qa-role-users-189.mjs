/**
 * SEKTOR-189 — roster Mode B (aliases + allowlist + auto-login owner).
 * Run: node sektor/e2e/scripts/verify-qa-role-users-189.mjs
 *
 * Live POST cursor-session?role=magasinier when 8082 is up; otherwise source-only.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '../../..');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const constants = join(
  ROOT,
  'sektor/sources/backend/socle/src/main/java/ma/nafura/socle/dev/config/QaLocalConstants.java',
);
const provisioner = join(
  ROOT,
  'sektor/sources/backend/socle/src/main/java/ma/nafura/socle/dev/config/QaLocalProvisioner.java',
);
const controller = join(
  ROOT,
  'sektor/sources/backend/socle/src/main/java/ma/nafura/socle/dev/api/CursorAuthController.java',
);
const tokenSh = join(ROOT, 'nafura-platform/ops/qa-token.sh');
const employes = join(
  ROOT,
  'sektor/sources/backend/app/src/main/java/ma/nafura/sektor/dev/QaLocalEmployeProvisioner.java',
);

for (const f of [constants, provisioner, controller, tokenSh, employes]) {
  if (!existsSync(f)) fail(`missing ${f}`);
}

const constantsSrc = readFileSync(constants, 'utf8');
const provisionerSrc = readFileSync(provisioner, 'utf8');
const controllerSrc = readFileSync(controller, 'utf8');
const tokenSrc = readFileSync(tokenSh, 'utf8');
const employesSrc = readFileSync(employes, 'utf8');

const emails = [
  'qa.ingenieur@nafuralabs.local',
  'qa.conducteur@nafuralabs.local',
  'qa.directeur@nafuralabs.local',
  'qa.daf@nafuralabs.local',
  'qa.dg@nafuralabs.local',
  'qa.chef-chantier@nafuralabs.local',
  'qa.magasinier@nafuralabs.local',
];
for (const email of emails) {
  if (!constantsSrc.includes(`"${email}"`)) fail(`roster missing ${email}`);
}
if (!constantsSrc.includes('OWNER_EMAIL = "qa@nafuralabs.local"')) {
  fail('owner email moved');
}
if (!provisionerSrc.includes('QaLocalConstants.ROLE_USERS')) {
  fail('provisioner does not seed ROLE_USERS');
}
if (!controllerSrc.includes('@RequestParam(required = false) String role')) {
  fail('cursor-session has no ?role=');
}
if (!controllerSrc.includes('QaLocalConstants.isOwnerEmail(user.getEmail())')) {
  fail('role users still minted as superAdmin');
}
if (!tokenSrc.includes('--data-urlencode "role=')) {
  fail('qa-token.sh does not pass role');
}
if (!employesSrc.includes('"qa-emp-"') || !employesSrc.includes('QaLocalConstants.ROLE_USERS')) {
  fail('QA employes not seeded from ROLE_USERS');
}

console.log('PASS  source: 7 role emails, provisioner, ?role=, superAdmin owner-only, qa-token.sh, employes');

const session = async (query) => {
  const url = `${API_BASE.replace(/\/$/, '')}/api/public/dev/cursor-session${query}`;
  const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
};

try {
  const owner = await session('');
  if (owner.status !== 200 || owner.body?.email !== 'qa@nafuralabs.local') {
    fail(`live owner session: HTTP ${owner.status} email=${owner.body?.email}`);
  }
  const mag = await session('?role=magasinier');
  if (mag.status !== 200 || mag.body?.email !== 'qa.magasinier@nafuralabs.local') {
    fail(`live magasinier session: HTTP ${mag.status} email=${mag.body?.email}`);
  }
  const bad = await session('?role=pointeur');
  if (bad.status !== 400) {
    fail(`live unknown role should be 400, got ${bad.status}`);
  }
  console.log('PASS  live: owner default, magasinier ?role=, pointeur 400');
} catch (err) {
  if (String(err).includes('fetch failed') || String(err).includes('ECONNREFUSED')) {
    console.log('SKIP  live: 8082 down — source proof still PASS');
    process.exit(0);
  }
  throw err;
}
