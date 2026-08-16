/**
 * CH-03-EVOL-hors-spec · extraction-builder-hors-contrat · AC-3
 * État initial : un tenant, une extraction joignable.
 * Ce BC ne compose / ne catalogue / ne versionne pas un type (not_owns → le produit).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BACK = path.join(REPO, "nafura-platform/sources/backend/document-extraction");
const WEB = path.join(REPO, "nafura-platform/sources/web/app/document-extraction");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build" || e.name === ".git") continue;
      walk(p, acc);
    } else if (/\.(java|ts|html)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

function rel(f) {
  return path.relative(REPO, f).replace(/\\/g, "/");
}

function hits(root, needle) {
  return walk(root).filter((f) => fs.readFileSync(f, "utf8").includes(needle)).map(rel);
}

test("extraction-builder-hors-contrat", () => {
  const forbiddenFiles = [
    "nafura-platform/sources/backend/document-extraction/src/main/java/ma/nafura/platform/documents/docextractor/service/builder/DocTypeBuilderEngine.java",
    "nafura-platform/sources/backend/document-extraction/src/main/java/ma/nafura/platform/documents/docextractor/service/DocTypeVersioningService.java",
    "nafura-platform/sources/web/app/document-extraction/builder/doc-type-builder-engine.ts",
    "nafura-platform/sources/web/app/document-extraction/services/doc-type-versioning.service.ts",
    "nafura-platform/sources/web/app/document-extraction/pages/doc-types-page/doc-types-page.component.ts",
    "nafura-platform/sources/web/app/document-extraction/pages/extraction-settings-doc-type-page/extraction-settings-doc-type-page.component.ts",
  ];
  const present = forbiddenFiles.filter((f) => fs.existsSync(path.join(REPO, f)));
  assert.deepEqual(present, [], `builder still on disk:\n${present.join("\n")}`);

  assert.deepEqual(hits(BACK, "propose-schema"), [], "propose-schema still exposed");
  assert.deepEqual(hits(BACK, "createDocType"), [], "createDocType still exposed");
  assert.deepEqual(hits(WEB, "/api/doc-types/v2"), [], "doc-types/v2 client still exposed");
  assert.deepEqual(hits(WEB, "doc-types/:domainKey/:docTypeKey"), [], "builder route still exposed");
  assert.deepEqual(hits(WEB, "onCreateCustomDocType"), [], "compose-type CTA still exposed");
});
