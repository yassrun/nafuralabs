/**
 * CH-00-INIT-conversation · conversation-frontiere-produit · AC-5
 * Compile : zéro type métier produit dans les jars qui entrent.
 * Hors scan : llm-provider (socle).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const ROOTS = [
  "nafura-platform/sources/backend/conversation/ai-conversation/src/main",
  "nafura-platform/sources/backend/conversation/ai-agent-api/src/main",
  "nafura-platform/sources/backend/conversation/ai-agent-runtime/src/main",
  "nafura-platform/sources/web/app/conversation",
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

test("conversation-frontiere-produit", () => {
  const rel = (f) => path.relative(REPO, f).replace(/\\/g, "/");
  assert.deepEqual(hits("FACTURE").map(rel), []);
  assert.deepEqual(hits("CHANTIER").map(rel), []);
  assert.deepEqual(hits("DpgfNoeud").map(rel), []);
});
