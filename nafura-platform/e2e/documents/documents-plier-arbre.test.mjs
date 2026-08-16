/**
 * CH-08-TECHNICAL-plier · documents-plier-arbre · AC-1, AC-2, AC-3, AC-5
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

test("documents-plier-arbre", () => {
  assert.equal(exists("nafura-platform/sources/backend/documents/build.gradle"), true);
  assert.equal(
    exists(
      "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/attachment/AttachmentController.java"
    ),
    true
  );
  assert.equal(exists("nafura-platform/sources/web/app/documents/index.ts"), true);
  assert.equal(
    exists("nafura-platform/sources/web/app/documents/components/attachment-list.component.ts"),
    true
  );

  const settings = read("nafura-platform/sources/backend/settings.gradle.kts");
  assert.match(settings, /include\(":platform:documents"\)/);
  assert.match(settings, /project\(":platform:documents"\)\.projectDir = file\("documents"\)/);

  const controller = read(
    "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/attachment/AttachmentController.java"
  );
  assert.match(controller, /package ma\.nafura\.platform\.collaboration\.docmanager/);
  assert.match(controller, /\/api\/v1\/platform\/collaboration\/attachments/);

  assert.equal(
    exists(
      "nafura-platform/sources/backend/features/collaboration/doc-manager/src/main/java/ma/nafura/doc_manager/attachment/AttachmentController.java"
    ),
    false
  );

  const here = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.match(here, /test\("documents-plier-arbre"/);
  assert.ok(exists("nafura-platform/e2e/documents/documents-joindre-et-rendre.test.mjs"));
});
