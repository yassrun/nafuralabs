/**
 * CH-00-INIT-impression · impression-deux-tenants · AC-2
 * État initial : modèle chez A ; B ensuite.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runImpressionJunit } from "./_gradle.mjs";

test("impression-deux-tenants", () => {
  const r = runImpressionJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deuxTenants"), r.out);
});
