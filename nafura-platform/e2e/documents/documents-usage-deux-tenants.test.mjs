/**
 * CH-03-EVOL-usage-tenant · documents-usage-deux-tenants · AC-3
 * État initial : A a un fichier ; B ensuite.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-usage-deux-tenants", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("usageDeuxTenants"), r.out);
});
