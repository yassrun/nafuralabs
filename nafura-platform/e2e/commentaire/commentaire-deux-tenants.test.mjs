/**
 * CH-00-INIT-commentaire · commentaire-deux-tenants · AC-3
 * État initial : même entité+id, A puis B.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runCommentaireJunit } from "./_gradle.mjs";

test("commentaire-deux-tenants", () => {
  const r = runCommentaireJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deuxTenants"), r.out);
});
