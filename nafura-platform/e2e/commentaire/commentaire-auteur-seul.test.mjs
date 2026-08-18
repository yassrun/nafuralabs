/**
 * CH-00-INIT-commentaire · commentaire-auteur-seul · AC-3
 * État initial : un message d'Alice ; Bob dans le même tenant.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runCommentaireJunit } from "./_gradle.mjs";

test("commentaire-auteur-seul", () => {
  const r = runCommentaireJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("auteurSeul"), r.out);
});
