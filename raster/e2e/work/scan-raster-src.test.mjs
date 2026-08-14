/**
 * INIT proof — walker reads raster-src peers, never pact/.
 * Run: node --test raster/e2e/work/scan-raster-src.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import os from "node:os";
import {
  collectTaskFiles,
  listRasterProjects,
  projectFromPath,
  treeFromPath,
  walkTaskFiles,
} from "../../walk-tasks.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

test("le walker ne remonte que les .md sous tasks/, à plat comme en sous-lot", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "raster-scan-"));
  try {
    const mk = (p, body = "x") => {
      fs.mkdirSync(path.dirname(path.join(tmp, p)), { recursive: true });
      fs.writeFileSync(path.join(tmp, p), body);
    };
    mk("lots/leave/tasks/A-1.md");
    mk("lots/leave/CH-01-EVOL-x/tasks/A-2.md");
    mk("lots/leave/CH-01-EVOL-x/00-PLAN.md"); // hors tasks/ → ignoré
    mk("lots/leave/README.md"); // hors tasks/ → ignoré
    mk("lots/leave/tasks/notes.txt"); // pas .md → ignoré
    mk("lots/_archive/tasks/A-9.md"); // archive → ignoré

    const found = walkTaskFiles(path.join(tmp, "lots"))
      .map((f) => path.relative(tmp, f).replace(/\\/g, "/"))
      .sort();
    assert.deepEqual(found, [
      "lots/leave/CH-01-EVOL-x/tasks/A-2.md",
      "lots/leave/tasks/A-1.md",
    ]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("projectFromPath lit le projet dans le chemin", () => {
  assert.equal(
    projectFromPath(REPO, path.join(REPO, "sektor/raster-src/lots/rh/tasks/S-1.md")),
    "sektor"
  );
  assert.equal(
    projectFromPath(
      REPO,
      path.join(REPO, "mbs-website/raster-src/lots/site/tasks/M-1.md")
    ),
    "mbs-website"
  );
});

test("scan never includes pact/", () => {
  const files = collectTaskFiles(REPO);
  const pactHit = files
    .map((f) => path.relative(REPO, f).replace(/\\/g, "/"))
    .filter((f) => /(^|\/)pact\//.test(f));
  assert.deepEqual(pactHit, []);
});

test("tout ce qui est scanné vit sous raster-src/lots/**/tasks/", () => {
  const files = collectTaskFiles(REPO);
  for (const f of files) {
    const r = path.relative(REPO, f).replace(/\\/g, "/");
    assert.match(r, /raster-src\/lots\/.+\/tasks\/[^/]+\.md$/, r);
  }
});

test("un projet Raster existe ssi <projet>/raster-src/lots existe", () => {
  const names = listRasterProjects(REPO);

  // chaque projet détecté a bien le dossier qui le définit
  for (const n of names) {
    const peer = path.join(REPO, n, "raster-src", "lots");
    assert.ok(fs.existsSync(peer), `${n} détecté sans raster-src/lots`);
  }

  // et aucun dossier ayant raster-src/lots n'est oublié
  for (const e of fs.readdirSync(REPO, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    if (!fs.existsSync(path.join(REPO, e.name, "raster-src", "lots"))) continue;
    assert.ok(names.includes(e.name), `${e.name} a raster-src/lots mais n'est pas détecté`);
  }
});

test("scan does not include docs/specs tickets", () => {
  const files = collectTaskFiles(REPO);
  const rel = files.map((f) => path.relative(REPO, f).replace(/\\/g, "/"));
  assert.equal(
    rel.filter((f) => f.includes("/docs/specs/")).length,
    0
  );
});

test("l'arbre est dans le chemin — pas dans un champ parent:", () => {
  const f = path.join(
    REPO,
    "conges/raster-src/lots/leave/CH-01-EVOL-justificatif/tasks/CNG-9-x.md"
  );
  assert.deepEqual(treeFromPath(REPO, f), {
    project: "conges",
    lot: "leave",
    souslot: "CH-01-EVOL-justificatif",
  });

  const flat = path.join(REPO, "compta/raster-src/lots/tva/tasks/CPT-1-x.md");
  assert.deepEqual(treeFromPath(REPO, flat), {
    project: "compta",
    lot: "tva",
    souslot: "",
  });
});

test("agent_type mapping is immutable", async () => {
  const { expectedAgentType, resolveAgentType, skillForAgentType } =
    await import("../../agent-type.mjs");
  assert.equal(expectedAgentType("spec"), "spec");
  assert.equal(expectedAgentType("feature"), "exec");
  assert.equal(expectedAgentType("bug"), "exec");
  assert.equal(expectedAgentType("tech"), "exec");
  assert.equal(expectedAgentType("physical"), "exec");
  assert.equal(expectedAgentType("qa"), "qa");
  assert.equal(resolveAgentType("feature", ""), "exec");
  assert.equal(resolveAgentType("qa", "qa"), "qa");
  assert.throws(() => resolveAgentType("qa", "exec"));
  assert.throws(() => resolveAgentType("spec", "exec"));
  assert.throws(() => resolveAgentType("feature", "orch"));
  assert.equal(skillForAgentType("orch"), "nafura-orch");
});

test("INDEX porte l'arbre (lot/souslot) et plus kind/parent", () => {
  const tsv = fs.readFileSync(path.join(REPO, "raster", "INDEX.tsv"), "utf8");
  const header = tsv.split("\n")[0];
  assert.ok(header.includes("\ttype\t"), header);
  assert.ok(header.includes("\tagent_type\t"), header);
  assert.ok(header.includes("\tlot\t"), header);
  assert.ok(header.includes("\tsouslot\t"), header);
  assert.ok(!header.includes("\tkind\t"), "kind supprimé");
  assert.ok(!header.includes("\tparent\t"), "parent supprimé");
});
