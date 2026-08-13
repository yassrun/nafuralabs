/**
 * INIT proof — walker reads raster-src peers, never pact/.
 * Run: node --test raster/e2e/work/scan-raster-src.test.mjs
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  collectTaskFiles,
  listRasterProjects,
  projectFromPath,
} from "../../walk-tasks.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

test("scan finds MIG-11 on peer raster-src", () => {
  const files = collectTaskFiles(REPO);
  const rel = files.map((f) => path.relative(REPO, f).replace(/\\/g, "/"));
  const mig = rel.find((f) => f.includes("MIG-11-"));
  assert.ok(mig, "expected MIG-11 under nafuralabs-migration/raster-src");
  assert.equal(projectFromPath(REPO, path.join(REPO, mig)), "nafuralabs-migration");
});

test("scan never includes pact/", () => {
  const files = collectTaskFiles(REPO);
  const pactHit = files
    .map((f) => path.relative(REPO, f).replace(/\\/g, "/"))
    .filter((f) => /(^|\/)pact\//.test(f));
  assert.deepEqual(pactHit, []);
});

test("scan finds RAS-13 on raster/raster-src", () => {
  const files = collectTaskFiles(REPO);
  const rel = files.map((f) => path.relative(REPO, f).replace(/\\/g, "/"));
  const ras = rel.find((f) => f.includes("RAS-13-"));
  assert.ok(ras, "expected RAS-13 under raster/raster-src");
  assert.equal(projectFromPath(REPO, path.join(REPO, ras)), "raster");
});

test("projects are only those with raster-src/lots", () => {
  const names = listRasterProjects(REPO);
  assert.ok(names.includes("raster"));
  assert.ok(names.includes("nafuralabs-migration"));
  assert.ok(!names.includes("sektor-btp"));
  assert.ok(!names.includes("ops"));
  assert.ok(!names.includes("personal"));
  assert.ok(!names.includes("mbs-website"));
});

test("scan does not include docs/specs tickets", () => {
  const files = collectTaskFiles(REPO);
  const rel = files.map((f) => path.relative(REPO, f).replace(/\\/g, "/"));
  assert.equal(
    rel.filter((f) => f.includes("/docs/specs/")).length,
    0
  );
});
