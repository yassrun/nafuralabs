/**
 * CH-00-INIT-conversation · conversation-session-introuvable · AC-3
 * État initial : tenant A, un id de session inconnu.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runConversationJunit } from "./_gradle.mjs";

test("conversation-session-introuvable", { timeout: 300_000 }, () => {
  const r = runConversationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("sessionIntrouvable"), r.out);
});
