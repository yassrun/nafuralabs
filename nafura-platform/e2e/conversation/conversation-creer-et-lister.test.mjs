/**
 * CH-00-INIT-conversation · conversation-creer-et-lister · AC-3
 * État initial : tenant A, une personne authentifiée.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runConversationJunit } from "./_gradle.mjs";

test("conversation-creer-et-lister", { timeout: 300_000 }, () => {
  const r = runConversationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("creerEtLister"), r.out);
});
