/**
 * CH-00-INIT-identite · identite-retirer-membre · AC-3 (R-5)
 * État initial : un membre (invité) chez A — email invitee-a@example.test.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runIdentiteJunit } from "./_gradle.mjs";

test("identite-retirer-membre", () => {
  const r = runIdentiteJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("retirerMembre"), r.out);
});
