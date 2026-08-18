/**
 * CH-00-INIT-identite · identite-inviter-membre · AC-3 (R-2)
 * État initial : tenant A, admin ; email invitee-a@example.test pas encore membre de A ; un code de rôle qui existe pour A.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runIdentiteJunit } from "./_gradle.mjs";

test("identite-inviter-membre", () => {
  const r = runIdentiteJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("inviterMembre"), r.out);
});
