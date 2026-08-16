/**
 * CH-03-EVOL-hors-spec · extraction-workflow-hors-contrat · AC-3
 * État initial : une extraction réussie (structure + doutes publiés).
 * Ce BC ne fait pas décider un résultat (brouillon / validé / refusé → Approbation).
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

test("extraction-workflow-hors-contrat", () => {
  const forbiddenFiles = [
    "nafura-platform/sources/backend/document-extraction/src/main/java/ma/nafura/platform/documents/docextractor/service/WorkflowTransitionService.java",
    "nafura-platform/sources/web/app/document-extraction/services/document-workflow.service.ts",
    "nafura-platform/sources/web/app/document-extraction/models/document-workflow.model.ts",
  ];
  const present = forbiddenFiles.filter((f) => fs.existsSync(path.join(REPO, f)));
  assert.deepEqual(present, [], `decision workflow still on disk:\n${present.join("\n")}`);

  assert.deepEqual(
    hits(WEB, "/api/extractions/validate"),
    [],
    "validate-result API client still exposed"
  );
  assert.deepEqual(
    hits(WEB, "rejectDocument"),
    [],
    "rejectDocument still exposed"
  );
  assert.deepEqual(
    hits(BACK, "Transition from"),
    [],
    "workflow transition still exposed"
  );
});
