/**
 * CH-00-INIT-commentaire · commentaire-retirer · AC-3
 * État initial : un message présent chez A, posté par A.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runCommentaireJunit } from "./_gradle.mjs";

test("commentaire-retirer", () => {
  const r = runCommentaireJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("retirer"), r.out);
});
