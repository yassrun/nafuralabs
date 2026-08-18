/**
 * CH-00-INIT-commentaire · commentaire-repondre · AC-3
 * État initial : un message racine chez A.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runCommentaireJunit } from "./_gradle.mjs";

test("commentaire-repondre", () => {
  const r = runCommentaireJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("repondre"), r.out);
});
