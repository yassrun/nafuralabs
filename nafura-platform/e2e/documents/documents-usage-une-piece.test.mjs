/**
 * CH-03-EVOL-usage-tenant · documents-usage-une-piece · AC-1
 * État initial : tenant A, un fichier de N octets.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-usage-une-piece", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("usageUnePiece"), r.out);
});
