/**
 * CH-07-EVOL-unifier · documents-unifier-deux-tenants · AC-3
 * État initial : mêmes octets, A puis B.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-unifier-deux-tenants", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("unifierDeuxTenants"), r.out);
});
