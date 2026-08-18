/**
 * CH-00-INIT-approbation · approbation-deux-tenants · AC-3
 * État initial : une demande en attente chez A ; session B ensuite.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runApprobationJunit } from "./_gradle.mjs";

test("approbation-deux-tenants", () => {
  const r = runApprobationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deuxTenants"), r.out);
});
