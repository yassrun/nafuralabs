/**
 * CH-07-EVOL-unifier · documents-piece-puis-tenu · AC-2
 * État initial : tenant A, un fichier, pièce puis tenu.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-piece-puis-tenu", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("piecePuisTenu"), r.out);
});
