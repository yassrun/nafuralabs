/**
 * CH-00-INIT-impression · impression-frontiere-produit · AC-3
 * Compile : zéro type métier produit dans le contrat impression.
 * PrintDocument (forme facture) est hors contrat — exclu du scan.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const ROOTS = [
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/template/TemplateRenderService.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/template/PdfGenerationService.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/template/TemplateBodyValidator.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/template/HtmlOutboundGuard.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/api/controller/TemplateController.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/service/DocumentTemplateService.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/domain/model/DocumentTemplate.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/repository/DocumentTemplateRepository.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/api/request/TemplateRenderRequest.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/api/request/TemplatePreviewRequest.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/api/request/DocumentTemplateCreateRequest.java",
  "nafura-platform/sources/backend/impression/src/main/java/ma/nafura/doc_manager/api/request/DocumentTemplateUpdateRequest.java",
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

test("impression-frontiere-produit", () => {
  const rel = (f) => path.relative(REPO, f).replace(/\\/g, "/");
  assert.deepEqual(hits("FACTURE").map(rel), []);
  assert.deepEqual(hits("CHANTIER").map(rel), []);
  assert.deepEqual(hits("DpgfNoeud").map(rel), []);
});
