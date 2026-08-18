/**
 * CH-01-TECHNICAL-plier · notification-plier-arbre · AC-1, AC-2, AC-3, AC-5
 * État initial : sources actuelles.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel) {
  return fs.readFileSync(path.join(REPO, rel), "utf8").replace(/\r\n/g, "\n");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO, rel));
}

test("notification-plier-arbre", () => {
  assert.equal(exists("nafura-platform/sources/backend/notification/build.gradle"), true);
  assert.equal(
    exists(
      "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/inapp/NotificationController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/controller/EmailTemplateController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/controller/EntityEmailController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/inapp/ErpAlertDismissalController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/notification/src/test/java/ma/nafura/notification/NotificationBaselineTest.java"
    ),
    true
  );

  assert.equal(exists("nafura-platform/sources/web/app/notification/index.ts"), true);
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/notification-bell.adapter.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/components/notification-bell.component.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/components/notification-list.component.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/services/notification-api.service.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/services/notification-unread.service.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/services/notification-stream.service.ts"),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/web/app/notification/services/notification-bell-close.service.ts"
    ),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/notifications.routes.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/notification/notification-center.page.ts"),
    true
  );

  const settings = read("nafura-platform/sources/backend/settings.gradle.kts");
  assert.match(settings, /include\(":platform:notification"\)/);
  assert.match(settings, /project\(":platform:notification"\)\.projectDir = file\("notification"\)/);
  assert.doesNotMatch(settings, /:platform:features:collaboration:notification/);

  const controller = read(
    "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/inapp/NotificationController.java"
  );
  assert.match(controller, /package ma\.nafura\.platform\.collaboration\.notification/);
  assert.match(controller, /\/api\/v1\/platform\/collaboration\/notifications/);

  const emailTemplates = read(
    "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/controller/EmailTemplateController.java"
  );
  assert.match(emailTemplates, /package ma\.nafura\.platform\.collaboration\.notification/);
  assert.match(emailTemplates, /\/api\/v1\/platform\/email-templates/);

  const entityEmail = read(
    "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/controller/EntityEmailController.java"
  );
  assert.match(entityEmail, /package ma\.nafura\.platform\.collaboration\.notification/);
  assert.match(entityEmail, /\/api\/v1\/platform\/email/);

  const erpAlerts = read(
    "nafura-platform/sources/backend/notification/src/main/java/ma/nafura/notification/inapp/ErpAlertDismissalController.java"
  );
  assert.match(erpAlerts, /package ma\.nafura\.platform\.collaboration\.notification/);
  assert.match(erpAlerts, /\/api\/v1\/erp\/alerts/);

  const baseline = read(
    "nafura-platform/sources/backend/notification/src/test/java/ma/nafura/notification/NotificationBaselineTest.java"
  );
  assert.match(baseline, /package ma\.nafura\.platform\.collaboration\.notification/);

  assert.equal(
    exists(
      "nafura-platform/sources/backend/features/collaboration/notification/src/main/java/ma/nafura/notification/inapp/NotificationController.java"
    ),
    false
  );
  assert.equal(
    exists("nafura-platform/sources/web/features/collaboration/notification/index.ts"),
    false
  );
  assert.equal(exists("nafura-platform/sources/web/features/notifications/notifications.routes.ts"), false);

  const gradle = read("nafura-platform/e2e/notification/_gradle.mjs");
  assert.match(gradle, /:platform:notification:test/);
  assert.match(gradle, /notification\/build\/test-results\/test/);
  assert.doesNotMatch(gradle, /:platform:features:collaboration:notification/);

  const here = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.match(here, /test\("notification-plier-arbre"/);
  assert.ok(exists("nafura-platform/e2e/notification/notification-deposer-et-lister.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/notification/notification-deux-tenants.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/notification/notification-marquer-lue.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/notification/notification-autre-destinataire.test.mjs"));
});
