/**
 * CH-05-EVOL-quota · documents-quota-dedup-passe · AC-3
 * État initial : A déjà au plafond, même fichier à nouveau.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-quota-dedup-passe", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("quotaDedupPasse"), r.out);
});
