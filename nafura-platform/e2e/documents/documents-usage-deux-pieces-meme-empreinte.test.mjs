/**
 * CH-03-EVOL-usage-tenant · documents-usage-deux-pieces-meme-empreinte · AC-2
 * État initial : A, deux jointures, mêmes octets.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-usage-deux-pieces-meme-empreinte", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("usageDeuxPiecesMemeEmpreinte"), r.out);
});
