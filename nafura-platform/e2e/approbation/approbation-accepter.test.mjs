/**
 * CH-00-INIT-approbation · approbation-accepter · AC-3
 * État initial : tenant A, une demande en attente à une étape dont le rôle est celui de l'utilisateur.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runApprobationJunit } from "./_gradle.mjs";

test("approbation-accepter", () => {
  const r = runApprobationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("accepter"), r.out);
});
