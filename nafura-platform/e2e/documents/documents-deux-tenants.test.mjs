/**
 * CH-00-INIT-documents · documents-deux-tenants · AC-2
 * État initial : même entité+id, A puis B.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-deux-tenants", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deuxTenants"), r.out);
});
