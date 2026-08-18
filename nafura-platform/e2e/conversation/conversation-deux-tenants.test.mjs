/**
 * CH-00-INIT-conversation · conversation-deux-tenants · AC-3
 * État initial : une session chez A ; session B ensuite.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runConversationJunit } from "./_gradle.mjs";

test("conversation-deux-tenants", { timeout: 300_000 }, () => {
  const r = runConversationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deuxTenants"), r.out);
});
