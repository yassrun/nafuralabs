/**
 * CH-00-INIT-identite · identite-frontiere-produit · AC-3, AC-5 (INV-1)
 * Compile : zéro type métier produit dans les jars owned identite (identity + iam).
 * Ne scanne pas settings / app-settings / user-settings (not_owns).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const ROOTS = [
  "nafura-platform/sources/backend/core/identity/src/main/java",
  "nafura-platform/sources/backend/features/administration/iam/src/main/java",
];

function walk(target, acc = []) {
  if (!fs.existsSync(target)) return acc;
  const st = fs.statSync(target);
  if (st.isFile()) {
    if (/\.(java|ts)$/.test(target)) acc.push(target);
    return acc;
  }
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    const p = path.join(target, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build" || e.name === ".git") continue;
      walk(p, acc);
    } else if (/\.(java|ts)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

function hits(needle) {
  return ROOTS.flatMap((rel) => walk(path.join(REPO, rel))).filter((f) =>
    fs.readFileSync(f, "utf8").includes(needle)
  );
}

test("identite-frontiere-produit", () => {
  const rel = (f) => path.relative(REPO, f).replace(/\\/g, "/");
  assert.deepEqual(hits("Devis").map(rel), []);
  assert.deepEqual(hits("Chantier").map(rel), []);
  assert.deepEqual(hits("Paie").map(rel), []);
});
