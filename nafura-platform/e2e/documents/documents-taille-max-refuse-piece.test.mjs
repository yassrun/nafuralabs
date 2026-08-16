/**
 * CH-04-EVOL-taille-max · documents-taille-max-refuse-piece · AC-2
 * État initial : tenant A, taille déclarée > 50 Mio.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-taille-max-refuse-piece", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("tailleMaxRefusePiece"), r.out);
});
