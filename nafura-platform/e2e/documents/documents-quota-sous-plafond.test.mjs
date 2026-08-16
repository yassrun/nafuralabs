/**
 * CH-05-EVOL-quota · documents-quota-sous-plafond · AC-1
 * État initial : A, usage + N ≤ plafond.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-quota-sous-plafond", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("quotaSousPlafond"), r.out);
});
