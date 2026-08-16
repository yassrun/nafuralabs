/**
 * CH-02-EVOL-download-tenant · documents-download-proprietaire · AC-1
 * État initial : pièce chez A.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-download-proprietaire", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("downloadProprietaire"), r.out);
});
