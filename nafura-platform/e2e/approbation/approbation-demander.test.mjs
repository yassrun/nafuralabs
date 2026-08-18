/**
 * CH-00-INIT-approbation · approbation-demander · AC-3
 * État initial : tenant A, un utilisateur, un enregistrement opaque sans demande.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runApprobationJunit } from "./_gradle.mjs";

test("approbation-demander", () => {
  const r = runApprobationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("demander"), r.out);
});
