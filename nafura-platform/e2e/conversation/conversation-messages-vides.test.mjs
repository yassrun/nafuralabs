/**
 * CH-00-INIT-conversation · conversation-messages-vides · AC-3
 * État initial : tenant A, une session nouvelle.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runConversationJunit } from "./_gradle.mjs";

test("conversation-messages-vides", { timeout: 300_000 }, () => {
  const r = runConversationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("messagesVides"), r.out);
});
