/**
 * CH-00-INIT-documents · documents-joindre-et-rendre · AC-1
 * État initial : tenant A, un petit fichier, entité opaque.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-joindre-et-rendre", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("joindreEtRendre"), r.out);
});
