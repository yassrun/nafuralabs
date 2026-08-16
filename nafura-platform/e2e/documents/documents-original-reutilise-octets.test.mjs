/**
 * CH-01-EVOL-octets-uniques · documents-original-reutilise-octets · AC-4
 * État initial : un original déjà déposé chez A, mêmes octets.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-original-reutilise-octets", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("originalReutiliseOctets"), r.out);
});
