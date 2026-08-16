/**
 * CH-00-INIT-documents · documents-frontiere-produit · AC-3
 * Compile : zéro type métier produit dans le contexte conservation.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const ROOTS = [
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/attachment",
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/storage",
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/service/DocumentService.java",
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/domain/model/Document.java",
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/domain/model/RecordAttachment.java",
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/domain/enums",
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/repository/DocumentRepository.java",
  "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/repository/RecordAttachmentRepository.java",
  "nafura-platform/sources/web/app/documents",
];

function walk(target, acc = []) {
  if (!fs.existsSync(target)) return acc;
  const st = fs.statSync(target);
  if (st.isFile()) {
    if (/\.(java|ts)$/.test(target)) acc.push(target);
    return acc;
  }
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    const p = path.join(target, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build" || e.name === ".git") continue;
      walk(p, acc);
    } else if (/\.(java|ts)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

function hits(needle) {
  return ROOTS.flatMap((rel) => walk(path.join(REPO, rel))).filter((f) =>
    fs.readFileSync(f, "utf8").includes(needle)
  );
}

test("documents-frontiere-produit", () => {
  const rel = (f) => path.relative(REPO, f).replace(/\\/g, "/");
  assert.deepEqual(hits("FACTURE").map(rel), []);
  assert.deepEqual(hits("CHANTIER").map(rel), []);
  assert.deepEqual(hits("DpgfNoeud").map(rel), []);
});
