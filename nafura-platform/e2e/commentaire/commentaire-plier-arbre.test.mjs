/**
 * CH-01-TECHNICAL-plier · commentaire-plier-arbre · AC-1, AC-2, AC-3, AC-5
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

test("commentaire-plier-arbre", () => {
  assert.equal(exists("nafura-platform/sources/backend/commentaire/build.gradle"), true);
  assert.equal(
    exists(
      "nafura-platform/sources/backend/commentaire/src/main/java/ma/nafura/comment/CommentController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/commentaire/src/test/java/ma/nafura/platform/collaboration/comment/CommentBaselineTest.java"
    ),
    true
  );
  assert.equal(exists("nafura-platform/sources/web/app/commentaire/index.ts"), true);
  assert.equal(
    exists("nafura-platform/sources/web/app/commentaire/components/comment-thread.component.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/commentaire/services/comment-api.service.ts"),
    true
  );

  const settings = read("nafura-platform/sources/backend/settings.gradle.kts");
  assert.match(settings, /include\(":platform:commentaire"\)/);
  assert.match(settings, /project\(":platform:commentaire"\)\.projectDir = file\("commentaire"\)/);
  assert.doesNotMatch(settings, /:platform:features:collaboration:comment/);

  const controller = read(
    "nafura-platform/sources/backend/commentaire/src/main/java/ma/nafura/comment/CommentController.java"
  );
  assert.match(controller, /package ma\.nafura\.platform\.collaboration\.comment/);
  assert.match(controller, /\/api\/v1\/platform\/collaboration\/comments/);

  const baseline = read(
    "nafura-platform/sources/backend/commentaire/src/test/java/ma/nafura/platform/collaboration/comment/CommentBaselineTest.java"
  );
  assert.match(baseline, /package ma\.nafura\.platform\.collaboration\.comment/);

  assert.equal(
    exists(
      "nafura-platform/sources/backend/features/collaboration/comment/src/main/java/ma/nafura/comment/CommentController.java"
    ),
    false
  );
  assert.equal(exists("nafura-platform/sources/web/features/collaboration/comment/index.ts"), false);

  const gradle = read("nafura-platform/e2e/commentaire/_gradle.mjs");
  assert.match(gradle, /:platform:commentaire:test/);
  assert.match(gradle, /commentaire\/build\/test-results\/test/);

  const here = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.match(here, /test\("commentaire-plier-arbre"/);
  assert.ok(exists("nafura-platform/e2e/commentaire/commentaire-poster-et-lire.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/commentaire/commentaire-deux-tenants.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/commentaire/commentaire-auteur-seul.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/commentaire/commentaire-retirer.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/commentaire/commentaire-repondre.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/commentaire/commentaire-frontiere-produit.test.mjs"));
});
