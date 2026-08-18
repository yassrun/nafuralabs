/**
 * CH-00-INIT-notification · notification-deux-tenants · AC-3
 * État initial : message déposé pour P chez A ; B ensuite.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runNotificationJunit } from "./_gradle.mjs";

test("notification-deux-tenants", () => {
  const r = runNotificationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deuxTenants"), r.out);
});
