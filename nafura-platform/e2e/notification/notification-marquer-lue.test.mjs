/**
 * CH-00-INIT-notification · notification-marquer-lue · AC-3
 * État initial : une non lue chez P dans A.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runNotificationJunit } from "./_gradle.mjs";

test("notification-marquer-lue", () => {
  const r = runNotificationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("marquerLue"), r.out);
});
