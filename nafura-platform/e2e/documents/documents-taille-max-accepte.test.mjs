/**
 * CH-04-EVOL-taille-max · documents-taille-max-accepte · AC-1
 * État initial : tenant A, fichier petit.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-taille-max-accepte", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("tailleMaxAccepte"), r.out);
});
