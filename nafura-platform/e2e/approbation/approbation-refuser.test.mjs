/**
 * CH-00-INIT-approbation · approbation-refuser · AC-3
 * État initial : tenant A, une demande en attente.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runApprobationJunit } from "./_gradle.mjs";

test("approbation-refuser", () => {
  const r = runApprobationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("refuser"), r.out);
});
