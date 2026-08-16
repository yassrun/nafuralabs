/**
 * CH-01-TECHNICAL-plier · impression-plier-arbre · AC-1, AC-2, AC-3, AC-5
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

test("impression-plier-arbre", () => {
  assert.equal(exists("nafura-platform/sources/backend/impression/build.gradle"), true);
  assert.equal(
    exists(
      "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/api/controller/TemplateController.java"
    ),
    true
  );
  assert.equal(exists("nafura-platform/sources/web/app/impression/index.ts"), true);

  const settings = read("nafura-platform/sources/backend/settings.gradle.kts");
  assert.match(settings, /include\(":platform:impression"\)/);
  assert.match(settings, /project\(":platform:impression"\)\.projectDir = file\("impression"\)/);

  const controller = read(
    "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/api/controller/TemplateController.java"
  );
  assert.match(controller, /package ma\.nafura\.platform\.collaboration\.docmanager/);
  assert.match(controller, /\/api\/v1\/platform\/templates/);

  assert.equal(
    exists(
      "nafura-platform/sources/backend/features/collaboration/doc-manager/src/main/java/ma/nafura/doc_manager/api/controller/TemplateController.java"
    ),
    false
  );

  const here = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.match(here, /test\("impression-plier-arbre"/);
  assert.ok(exists("nafura-platform/e2e/impression/impression-rendre-pdf.test.mjs"));
});
