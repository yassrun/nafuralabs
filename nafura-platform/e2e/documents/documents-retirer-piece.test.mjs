/**
 * CH-00-INIT-documents · documents-retirer-piece · AC-4
 * État initial : une pièce présente chez A.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-retirer-piece", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("retirerPiece"), r.out);
});
