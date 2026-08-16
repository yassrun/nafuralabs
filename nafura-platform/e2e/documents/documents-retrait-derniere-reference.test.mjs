/**
 * CH-01-EVOL-octets-uniques · documents-retrait-derniere-reference · AC-3
 * État initial : deux pièces, même empreinte, chez A.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-retrait-derniere-reference", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("retraitDerniereReference"), r.out);
});
