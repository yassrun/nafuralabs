/**
 * CH-02-EVOL-download-tenant · documents-download-autre-tenant · AC-2, AC-3
 * État initial : clé de A, session B.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-download-autre-tenant", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("downloadAutreTenant"), r.out);
});
