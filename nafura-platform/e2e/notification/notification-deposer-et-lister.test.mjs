/**
 * CH-00-INIT-notification · notification-deposer-et-lister · AC-3
 * État initial : tenant A, personne P, un message (titre + corps) déposé pour P.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runNotificationJunit } from "./_gradle.mjs";

test("notification-deposer-et-lister", () => {
  const r = runNotificationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("deposerEtLister"), r.out);
});
