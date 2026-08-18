/**
 * CH-00-INIT-identite · identite-deux-tenants · AC-3 (R-1, R-7, POL-TENANT-ISOLATION)
 * État initial : deux tenants A et B, chacun avec un admin membre ; A a un membre M (email unique à A).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runIdentiteJunit } from "./_gradle.mjs";

test("identite-deux-tenants", () => {
  const r = runIdentiteJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deuxTenants"), r.out);
});
