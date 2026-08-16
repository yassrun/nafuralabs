/**
 * CH-03-EVOL-usage-tenant · documents-usage-apres-retrait · AC-4
 * État initial : A, deux pièces même empreinte, puis retraits.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-usage-apres-retrait", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("usageApresRetrait"), r.out);
});
