/**
 * CH-09-EVOL-archive · documents-archive-absent · AC-2, AC-4
 * État initial : tenant A, un tenu déposé.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runDocumentsJunit } from "./_gradle.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MAIN = path.join(
  REPO,
  "nafura-platform/sources/backend/documents/src/main"
);

function walk(target, acc = []) {
  if (!fs.existsSync(target)) return acc;
  const st = fs.statSync(target);
  if (st.isFile()) {
    if (/\.(java|yml|yaml|xml|sql)$/.test(target)) acc.push(target);
    return acc;
  }
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    const p = path.join(target, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build" || e.name === ".git") continue;
      walk(p, acc);
    } else if (/\.(java|yml|yaml|xml|sql)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

test("documents-archive-absent", () => {
  const rel = (f) => path.relative(REPO, f).replace(/\\/g, "/");
  const hits = walk(MAIN).filter((f) =>
    /ARCHIVED|archivé/i.test(fs.readFileSync(f, "utf8"))
  );
  assert.deepEqual(hits.map(rel), [], "ARCHIVED / archivé encore présent dans le BC documents");

  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("archiveAbsent"), r.out);
});
