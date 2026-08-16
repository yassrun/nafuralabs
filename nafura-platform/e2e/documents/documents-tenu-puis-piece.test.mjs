/**
 * CH-07-EVOL-unifier · documents-tenu-puis-piece · AC-1
 * État initial : tenant A, un fichier, tenu puis pièce.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-tenu-puis-piece", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("tenuPuisPiece"), r.out);
});
