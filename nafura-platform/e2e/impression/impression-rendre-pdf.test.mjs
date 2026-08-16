/**
 * CH-00-INIT-impression · impression-rendre-pdf · AC-1
 * État initial : tenant A, un modèle, des données.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runImpressionJunit } from "./_gradle.mjs";

test("impression-rendre-pdf", () => {
  const r = runImpressionJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("rendrePdf"), r.out);
});
