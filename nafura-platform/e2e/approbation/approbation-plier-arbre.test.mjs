/**
 * CH-01-TECHNICAL-plier · approbation-plier-arbre · AC-1, AC-2, AC-3, AC-5
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

test("approbation-plier-arbre", () => {
  assert.equal(exists("nafura-platform/sources/backend/approbation/build.gradle"), true);
  assert.equal(
    exists(
      "nafura-platform/sources/backend/approbation/src/main/java/ma/nafura/workflow/ApprovalController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/approbation/src/test/java/ma/nafura/workflow/ApprobationBaselineTest.java"
    ),
    true
  );
  assert.equal(exists("nafura-platform/sources/web/app/approbation/index.ts"), true);
  assert.equal(
    exists("nafura-platform/sources/web/app/approbation/services/workflow-api.service.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/approbation/components/approval-banner.component.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/approbation/components/approval-action.component.ts"),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/web/app/approbation/components/workflow-template-select-dialog.component.ts"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/web/app/approbation/workflows/workflow-listing/workflow-listing.page.ts"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/web/app/approbation/workflows/services/workflow-templates-api.service.ts"
    ),
    true
  );

  const settings = read("nafura-platform/sources/backend/settings.gradle.kts");
  assert.match(settings, /include\(":platform:approbation"\)/);
  assert.match(settings, /project\(":platform:approbation"\)\.projectDir = file\("approbation"\)/);
  assert.doesNotMatch(settings, /:platform:features:collaboration:workflow/);

  const approval = read(
    "nafura-platform/sources/backend/approbation/src/main/java/ma/nafura/workflow/ApprovalController.java"
  );
  assert.match(approval, /package ma\.nafura\.platform\.collaboration\.workflow/);
  assert.match(approval, /\/api\/v1\/platform\/collaboration\/approvals/);

  const workflows = read(
    "nafura-platform/sources/backend/approbation/src/main/java/ma/nafura/workflow/WorkflowController.java"
  );
  assert.match(workflows, /package ma\.nafura\.platform\.collaboration\.workflow/);
  assert.match(workflows, /\/api\/v1\/platform\/collaboration\/workflows/);

  const templates = read(
    "nafura-platform/sources/backend/approbation/src/main/java/ma/nafura/workflow/WorkflowTemplateController.java"
  );
  assert.match(templates, /package ma\.nafura\.platform\.collaboration\.workflow/);
  assert.match(templates, /\/api\/v1\/platform\/collaboration\/workflow\/templates/);

  const baseline = read(
    "nafura-platform/sources/backend/approbation/src/test/java/ma/nafura/workflow/ApprobationBaselineTest.java"
  );
  assert.match(baseline, /package ma\.nafura\.platform\.collaboration\.workflow/);

  assert.equal(
    exists(
      "nafura-platform/sources/backend/features/collaboration/workflow/src/main/java/ma/nafura/workflow/ApprovalController.java"
    ),
    false
  );
  assert.equal(exists("nafura-platform/sources/web/features/collaboration/workflow/index.ts"), false);
  assert.equal(
    exists("nafura-platform/sources/web/features/administration/workflows/index.ts"),
    false
  );

  const gradle = read("nafura-platform/e2e/approbation/_gradle.mjs");
  assert.match(gradle, /:platform:approbation:test/);
  assert.match(gradle, /approbation\/build\/test-results\/test/);

  const here = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.match(here, /test\("approbation-plier-arbre"/);
  assert.ok(exists("nafura-platform/e2e/approbation/approbation-demander.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/approbation/approbation-accepter.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/approbation/approbation-refuser.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/approbation/approbation-deux-tenants.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/approbation/approbation-etapes.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/approbation/approbation-chaine.test.mjs"));
});
