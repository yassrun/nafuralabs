/**
 * CH-05-EVOL-quota · documents-quota-depasse · AC-2
 * État initial : A, usage + N > plafond, empreinte nouvelle.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-quota-depasse", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("quotaDepasse"), r.out);
});
