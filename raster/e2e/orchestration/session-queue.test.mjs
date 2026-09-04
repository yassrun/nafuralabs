/**
 * File Session — prune et clés.
 * Run: node --test raster/e2e/orchestration/session-queue.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  add,
  has,
  list,
  prune,
  remove,
  sessionKey,
} from "../../session-queue.mjs";

test("sessionKey formate project//lot//souslot", () => {
  assert.equal(sessionKey("raster", "orchestration", "modes-execution"), "raster//orchestration//modes-execution");
});

test("prune retire les sous-lots clos hors exécution", () => {
  const key = sessionKey("p", "lot", "sub");
  add(key);
  assert.ok(has(key));
  prune([{ key, ouvert: false }], []);
  assert.equal(has(key), false);
  assert.deepEqual(list(), []);
});

test("prune garde un sous-lot clos encore en cours", () => {
  const key = sessionKey("p", "lot", "sub");
  add(key);
  prune([{ key, ouvert: false }], [{ project: "p", lot: "lot", souslot: "sub" }]);
  assert.ok(has(key));
  remove(key);
});
