/**
 * CH-09-EVOL-archive · documents-tenu-retrait · AC-3
 * État initial : tenant A, un tenu déposé, seule référence.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-tenu-retrait", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("tenuRetrait"), r.out);
});
