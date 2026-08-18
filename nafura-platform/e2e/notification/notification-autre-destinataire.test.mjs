/**
 * CH-00-INIT-notification · notification-autre-destinataire · AC-3
 * État initial : tenant A, personnes P et Q, message déposé pour P.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runNotificationJunit } from "./_gradle.mjs";

test("notification-autre-destinataire", () => {
  const r = runNotificationJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("autreDestinataire"), r.out);
});
