/**
 * CH-00-INIT-approbation · approbation-etapes · AC-3
 * État initial : tenant A, une demande en attente à deux étapes (rôle utilisateur, puis un autre rôle).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runApprobationJunit } from "./_gradle.mjs";

test("approbation-etapes", () => {
  const r = runApprobationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("etapes"), r.out);
});
