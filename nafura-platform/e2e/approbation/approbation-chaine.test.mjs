/**
 * CH-00-INIT-approbation · approbation-chaine · AC-3
 * État initial : tenant A, admin-tenant, un type opaque ; tenant B ensuite.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runApprobationJunit } from "./_gradle.mjs";

test("approbation-chaine", () => {
  const r = runApprobationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("chaine"), r.out);
});
