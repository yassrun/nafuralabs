/**
 * CH-00-INIT-commentaire · commentaire-poster-et-lire · AC-3
 * État initial : tenant A, une personne, enregistrement opaque.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runCommentaireJunit } from "./_gradle.mjs";

test("commentaire-poster-et-lire", () => {
  const r = runCommentaireJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("posterEtLire"), r.out);
});
