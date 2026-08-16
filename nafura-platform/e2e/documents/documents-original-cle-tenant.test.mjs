/**
 * CH-00-INIT-documents · documents-original-cle-tenant · AC-5
 * État initial : un original déposé.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-original-cle-tenant", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("originalCleTenant"), r.out);
});
