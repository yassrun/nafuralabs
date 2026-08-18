/**
 * CH-00-INIT-identite · identite-accepter-invitation · AC-3 (R-3)
 * État initial : appartenance invitée pour invitee-a@example.test chez A, jeton valide ; IdP non branché (lab).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runIdentiteJunit } from "./_gradle.mjs";

test("identite-accepter-invitation", () => {
  const r = runIdentiteJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("accepterInvitation"), r.out);
});
