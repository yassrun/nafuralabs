#!/usr/bin/env node
/**
 * Validates Villa Hassan Gantt parser output and optionally imports phases on staging.
 * Usage:
 *   node scripts/validate-phase-import.mjs
 *   AUTH_TOKEN=... TENANT_ID=... node scripts/validate-phase-import.mjs --import
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const utilUrl = pathToFileURL(
  path.join(__dirname, '../app/pages/chantiers/utils/planning-gantt-pdf.util.ts'),
).href;

const {
  parseGanttPdfText,
  filterPlanningTasks,
  buildPhaseCode,
  isPaymentMilestone,
} = await import(utilUrl);

const fixturePath = path.join(
  __dirname,
  '../app/pages/chantiers/utils/fixtures/villa-hassan-gantt.txt',
);
const text = fs.readFileSync(fixturePath, 'utf8');
const parsed = parseGanttPdfText(text);
const filtered = filterPlanningTasks(parsed);

console.log('Parsed tasks:', parsed.length);
console.log('Work tasks (payments excluded):', filtered.length);
console.log('Payment milestones detected:', parsed.filter((t) => isPaymentMilestone(t.designation)).length);

if (filtered.length < 90) {
  console.error('FAIL: expected >= 90 work tasks');
  process.exit(1);
}

if (filtered.some((t) => isPaymentMilestone(t.designation))) {
  console.error('FAIL: payment milestones still present after filter');
  process.exit(1);
}

const sample = filtered.find((t) => t.numero === 11);
if (!sample || sample.dateDebut !== '2026-03-30' || sample.dateFin !== '2026-05-06') {
  console.error('FAIL: unexpected Enduits dates', sample);
  process.exit(1);
}

console.log('Parser validation OK (sample P011:', buildPhaseCode(11), sample.designation + ')');

const shouldImport = process.argv.includes('--import');
if (!shouldImport) {
  process.exit(0);
}

const token = process.env.AUTH_TOKEN;
const tenantId = process.env.TENANT_ID ?? 'sektor-demo';
const apiBase = process.env.API_BASE ?? 'http://api.sektor.nafuralabs.staging';
const chantierId = process.env.CHANTIER_ID ?? 'ch-001';

if (!token) {
  console.error('AUTH_TOKEN required for --import');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Tenant-Id': tenantId,
};

const existingRes = await fetch(`${apiBase}/api/v1/chantiers/${chantierId}/phases`, { headers });
if (!existingRes.ok) {
  console.error('Failed to list phases:', existingRes.status, await existingRes.text());
  process.exit(1);
}
const existing = await existingRes.json();
const byCode = new Map(existing.map((p) => [p.code, p]));
let created = 0;
let skipped = 0;
let failed = 0;

for (const task of filtered) {
  const code = buildPhaseCode(task.numero);
  if (byCode.has(code)) {
    skipped += 1;
    continue;
  }
  const res = await fetch(`${apiBase}/api/v1/chantiers/${chantierId}/phases`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      code,
      designation: task.designation,
      dateDebut: task.dateDebut,
      dateFin: task.dateFin,
      avancementPercent: 0,
      status: 'PLANIFIE',
    }),
  });
  if (res.ok) {
    created += 1;
    byCode.set(code, await res.json());
  } else {
    failed += 1;
    console.error('Create failed', code, res.status, await res.text());
  }
}

console.log('Import result:', { created, skipped, failed, total: byCode.size });

const verifyRes = await fetch(`${apiBase}/api/v1/chantiers/${chantierId}/phases`, { headers });
const finalPhases = await verifyRes.json();
console.log('Final phase count:', finalPhases.length);
const payments = finalPhases.filter((p) => /règlement|reglement|avance.*dém/i.test(p.designation));
console.log('Payment phases in DB:', payments.length);

if (failed > 0) {
  process.exit(1);
}
