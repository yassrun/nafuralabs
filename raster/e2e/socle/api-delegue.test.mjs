/**
 * Contrat structurel de l'API Raster.
 * Run: node --test raster/e2e/socle/api-delegue.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p) => fs.readFileSync(path.join(REPO, p), "utf8");
const API = "raster/sources/web/server/raster-api.ts";
const FRONT_API = "raster/sources/web/src/api.ts";
const APP = "raster/sources/web/src/App.tsx";

test("le serveur n'écrit aucune Task lui-même", () => {
  const src = read(API);
  const writes = [...src.matchAll(/fs\.writeFileSync\([^)]*/g)].map((m) => m[0]);
  assert.deepEqual(
    writes.filter((write) => !write.includes("inbox.md")),
    []
  );
  assert.ok(!/nextIdForPrefix|PROJECT_PREFIX|setFrontmatterField/.test(src));
});

test("les mutations de Task passent par le moteur", () => {
  const src = read(API);
  for (const fn of ["createTask", "promoteLine", "setStatus"]) {
    assert.ok(src.includes(fn), `${fn} non importé par le serveur`);
  }
  assert.ok(src.includes("RefusError"));
});

test("QA, approbation et attente humaine ont quitté l'API et l'UI", () => {
  const all = [read(API), read(FRONT_API), read(APP)].join("\n");
  assert.ok(!/api\.approve|\/approve|onApprove|done-agent|done-me|task\.attend/.test(all));
  assert.ok(!/question:\s*section\(|attend:/.test(read(API)));
});

test("le mode local ou agents est transmis au moteur", () => {
  const api = read(API);
  const front = read(FRONT_API);
  const app = read(APP);
  assert.ok(api.includes("configuredModes"));
  assert.ok(api.includes("harnessBrief"));
  assert.ok(/mode\?: "local" \| "agents"/.test(api));
  assert.ok(front.includes('ExecutionMode = "local" | "agents"'));
  assert.ok(front.includes("JSON.stringify({ project, lot, souslot, mode })"));
  assert.ok(app.includes("Agents cloud"));
  assert.ok(api.includes("startSubSession"));
  assert.ok(api.includes("onExit:"));
  assert.ok(api.includes("progressed"));
});

test("le rapport de livraison reste exposé", () => {
  assert.ok(/rapport:\s*section\(/.test(read(API)));
});
