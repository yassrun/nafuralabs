/**
 * CH-02-EVOL-sans-facture · impression-type-opaque · AC-1, AC-2
 * État initial : jar impression avec PrintDocument — l'ancienne vérité doit échouer.
 * Discrimination : rouge tant que PrintDocument est dans le jar.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runImpressionJunit } from "./_gradle.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const IMPRESSION_MAIN = path.join(
  REPO,
  "nafura-platform/sources/backend/impression/src/main/java"
);

const TYPE_DECL = /\b(?:class|record|interface|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const FORBIDDEN_TYPE = /^(PrintDocument|Line|Totals|Totaux|Tva|TVA)$/;

function walkJava(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "build" || e.name === "node_modules") continue;
      walkJava(p, acc);
    } else if (e.name.endsWith(".java")) {
      acc.push(p);
    }
  }
  return acc;
}

function declaredTypes() {
  const found = [];
  for (const file of walkJava(IMPRESSION_MAIN)) {
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(TYPE_DECL)) {
      found.push({
        name: m[1],
        file: path.relative(REPO, file).replace(/\\/g, "/"),
      });
    }
  }
  return found;
}

test("impression-type-opaque", () => {
  const forbidden = declaredTypes().filter((t) => FORBIDDEN_TYPE.test(t.name));
  assert.deepEqual(
    forbidden,
    [],
    `types facture encore dans le jar impression: ${JSON.stringify(forbidden)}`
  );

  const mentions = walkJava(IMPRESSION_MAIN).filter((f) =>
    /\bPrintDocument\b/.test(fs.readFileSync(f, "utf8"))
  );
  assert.deepEqual(
    mentions.map((f) => path.relative(REPO, f).replace(/\\/g, "/")),
    [],
    "PrintDocument encore cité dans le jar impression"
  );

  const r = runImpressionJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("typeOpaque"), r.out);
});
