/**
 * CH-00-INIT-lecture · lecture-frontiere-produit · AC-3
 * Compile : zéro type métier produit dans lecture ; zéro empreinte côté produit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "build" || e.name === ".git") continue;
      walk(p, acc);
    } else if (/\.(java|ts)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

function hits(root, needle) {
  return walk(root).filter((f) => fs.readFileSync(f, "utf8").includes(needle));
}

test("lecture-frontiere-produit", () => {
  const platformSrc = path.join(REPO, "nafura-platform/sources");
  const sektorSrc = path.join(REPO, "sektor/sources");
  const dpgf = hits(platformSrc, "DpgfNoeud");
  const fp = hits(sektorSrc, "LayoutFingerprint");
  assert.deepEqual(
    dpgf.map((f) => path.relative(REPO, f).replace(/\\/g, "/")),
    []
  );
  assert.deepEqual(
    fp.map((f) => path.relative(REPO, f).replace(/\\/g, "/")),
    []
  );
});
