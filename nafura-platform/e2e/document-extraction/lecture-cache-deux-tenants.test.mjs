/**
 * CH-00-INIT-lecture · lecture-cache-deux-tenants · AC-2
 * État initial : même empreinte, tenant A puis B.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runLectureJunit } from "./_gradle.mjs";

test("lecture-cache-deux-tenants", () => {
  const r = runLectureJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("cacheIsIsolatedPerTenant"), r.out);
});
