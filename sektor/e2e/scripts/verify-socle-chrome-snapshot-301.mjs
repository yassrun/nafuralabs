/**
 * SEKTOR-301 — boot chrome = un GET /api/v1/erp/chrome, plus de fan-out listings.
 *
 * Discrimination (rouge avant) :
 * - ErpNotificationsService importe FactureMarcheApiService / CautionApiService / FormationApiService
 * - CompletenessMeterComponent appelle getCompleteness
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

const controller =
  'sektor/sources/backend/socle/src/main/java/ma/nafura/socle/chrome/api/ErpChromeController.java';
const snapshot =
  'sektor/sources/backend/socle/src/main/java/ma/nafura/socle/chrome/service/ErpChromeSnapshotService.java';
const notif = 'sektor/sources/web/app/socle/shell/erp-notifications.service.ts';
const chrome = 'sektor/sources/web/app/socle/shell/erp-chrome-snapshot.service.ts';
const meter =
  'sektor/sources/web/app/socle/onboarding/components/completeness-meter/completeness-meter.component.ts';
const boot = 'sektor/sources/web/app/socle/app.config.ts';
const testJava =
  'sektor/sources/backend/socle/src/test/java/ma/nafura/socle/chrome/service/ErpChromeSnapshotServiceTest.java';

const controllerSrc = read(controller);
const snapshotSrc = read(snapshot);
const notifSrc = read(notif);
const chromeSrc = read(chrome);
const meterSrc = read(meter);
const bootSrc = read(boot);
const testSrc = read(testJava);

if (!controllerSrc.includes('@RequestMapping("/api/v1/erp/chrome")')) {
  fail('ErpChromeController missing GET mapping /api/v1/erp/chrome');
}
if (!snapshotSrc.includes('overdueInvoices') || !snapshotSrc.includes('cleanupResolved')) {
  fail('snapshot must query overdue invoices and cleanup dismissals server-side');
}
if (snapshotSrc.includes('getAll()')) {
  fail('snapshot must not dump listings via getAll');
}

for (const forbidden of [
  'FactureMarcheApiService',
  'CautionApiService',
  'FormationApiService',
  'ApprobationsApiService',
  'listDismissedKeys',
  'cleanupResolved',
]) {
  if (notifSrc.includes(forbidden)) {
    fail(`erp-notifications.service still fans out via ${forbidden}`);
  }
}

if (!chromeSrc.includes('/api/v1/erp/chrome')) {
  fail('ErpChromeSnapshotService must GET /api/v1/erp/chrome');
}
if (!bootSrc.includes('erpNotif.refresh()')) {
  fail('APP_INITIALIZER must still refresh chrome alerts at boot');
}
if (meterSrc.includes('getCompleteness') || meterSrc.includes('OnboardingApiService')) {
  fail('completeness meter must read the chrome store, not call /completeness');
}
if (!meterSrc.includes('ErpChromeSnapshotService')) {
  fail('completeness meter must inject ErpChromeSnapshotService');
}
if (!testSrc.includes('snapshotAssemblesAlertsFiltersDismissedAndCompleteness')) {
  fail('missing Java unit test for chrome snapshot');
}

console.log('OK    SEKTOR-301 chrome snapshot is one GET at boot (alerts + completeness)');
