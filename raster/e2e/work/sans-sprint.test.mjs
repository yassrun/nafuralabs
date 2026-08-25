/**
 * Preuve Raster— preuve 1…4 : le champ, la commande et SPRINT.md n'existent plus.
 * Run: node --test raster/e2e/work/sans-sprint.test.mjs
 *
 * Échoue si `sprint` réapparaît dans le moteur, si SPRINT.md est présent,
 * ou si INDEX.tsv porte une colonne sprint.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { collectTaskFiles } from "../../walk-tasks.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const RASTER = path.join(REPO, "raster");
const MOTEUR = ["write.mjs", "regen.mjs", "check.mjs", "t.mjs"];

function frontmatterBlock(raw) {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) return "";
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return "";
  return raw.slice(4, end).replace(/\r/g, "");
}

test("preuve 1 — aucune occurrence de sprint dans le moteur", () => {
  for (const name of MOTEUR) {
    const src = fs.readFileSync(path.join(RASTER, name), "utf8");
    assert.ok(
      !/sprint/i.test(src),
      `${name} contient encore « sprint »`
    );
  }
});

test("preuve 1 — aucune clé sprint: dans le frontmatter des tasks", () => {
  const hits = [];
  for (const file of collectTaskFiles(REPO)) {
    const block = frontmatterBlock(fs.readFileSync(file, "utf8"));
    if (/^sprint:/m.test(block)) {
      hits.push(path.relative(REPO, file).replace(/\\/g, "/"));
    }
  }
  assert.deepEqual(hits, [], `clé sprint: encore présente : ${hits.join(" | ")}`);
});

test("preuve 2 — t.mjs sprint n'existe plus, -h ne la propose pas", () => {
  const help = spawnSync(process.execPath, ["raster/t.mjs", "-h"], {
    cwd: REPO,
    encoding: "utf8",
  });
  assert.equal(help.status, 0, help.stderr);
  assert.ok(!/sprint/i.test(help.stdout), "t.mjs -h propose encore sprint");

  const unknown = spawnSync(process.execPath, ["raster/t.mjs", "sprint"], {
    cwd: REPO,
    encoding: "utf8",
  });
  assert.notEqual(unknown.status, 0, "t.mjs sprint devrait être inconnue");
  assert.ok(
    /inconnue/i.test(unknown.stderr + unknown.stdout),
    unknown.stderr + unknown.stdout
  );
});

test("preuve 3 — SPRINT.md est absent et index ne le régénère pas", async () => {
  const { regen } = await import("../../regen.mjs");
  regen();
  assert.ok(
    !fs.existsSync(path.join(RASTER, "SPRINT.md")),
    "raster/SPRINT.md est encore là"
  );
});

test("preuve 4 — INDEX.tsv n'a plus de colonne sprint", () => {
  const header = fs.readFileSync(path.join(RASTER, "INDEX.tsv"), "utf8").split("\n")[0];
  const cols = header.split("\t");
  assert.ok(!cols.includes("sprint"), `colonne sprint encore dans l'en-tête : ${header}`);
});
