/**
 * Preuve CH-01-EVOL-spawn-worktree — AC-1 · AC-2 · AC-6.
 * Run: node --test raster/e2e/orchestration/spawn-worktree.test.mjs
 *
 * Tout ce qui est testé ici REFUSE avant de toucher à git : aucun worktree n'est
 * créé, aucun processus n'est lancé. Les preuves qui demandent un vrai worktree
 * (AC-3 double lancement, AC-4 libération, AC-5 arrêt) sont dans le rapport de
 * RAS-99 — elles coûtent un checkout de 6 775 fichiers, trop cher pour une suite.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  branchName,
  insideRepo,
  worktreePath,
  worktreeRoot,
  addWorktree,
  WorktreeError,
  REPO_ROOT,
} from "../../worktree.mjs";
import { agentCommand, start, SpawnError } from "../../spawn.mjs";

const read = (p) => fs.readFileSync(path.join(REPO_ROOT, p), "utf8");

test("AC-1 — le worktree par défaut est hors du dépôt", () => {
  delete process.env.RASTER_WORKTREES;
  assert.equal(insideRepo(worktreeRoot()), false);
  assert.equal(insideRepo(worktreePath("raster", "socle", "CH-01")), false);
});

test("AC-1 — un emplacement DANS le dépôt est refusé", () => {
  const avant = process.env.RASTER_WORKTREES;
  process.env.RASTER_WORKTREES = path.join(REPO_ROOT, "raster", "wt");
  try {
    assert.equal(insideRepo(worktreePath("raster", "socle", "CH-01")), true);
    assert.throws(
      () => addWorktree("raster", "socle", "CH-01"),
      WorktreeError,
      "un worktree dans le dépôt ferait compter chaque task deux fois"
    );
  } finally {
    if (avant === undefined) delete process.env.RASTER_WORKTREES;
    else process.env.RASTER_WORKTREES = avant;
  }
});

test("insideRepo ne confond pas le dépôt lui-même avec son intérieur", () => {
  assert.equal(insideRepo(REPO_ROOT), false);
  assert.equal(insideRepo(path.join(REPO_ROOT, "raster")), true);
  assert.equal(insideRepo(path.join(REPO_ROOT, "..", "ailleurs")), false);
});

test("la branche suit le sous-lot, ou le lot à défaut", () => {
  assert.equal(branchName("socle", "CH-01-EVOL-x"), "socle/CH-01-EVOL-x");
  assert.equal(branchName("socle", ""), "lot/socle");
});

test("AC-2 — sans RASTER_AGENT_CMD, il n'y a pas de commande", () => {
  const avant = process.env.RASTER_AGENT_CMD;
  delete process.env.RASTER_AGENT_CMD;
  try {
    assert.equal(agentCommand(), null);
    process.env.RASTER_AGENT_CMD = "   ";
    assert.equal(agentCommand(), null, "une valeur blanche ne compte pas");
  } finally {
    if (avant === undefined) delete process.env.RASTER_AGENT_CMD;
    else process.env.RASTER_AGENT_CMD = avant;
  }
});

test("AC-2 — le spawn refuse, et refuse AVANT de créer un worktree", () => {
  const avant = process.env.RASTER_AGENT_CMD;
  delete process.env.RASTER_AGENT_CMD;
  try {
    assert.throws(
      () => start({ project: "raster", lot: "lot-inexistant-pour-le-test" }),
      (e) => e instanceof SpawnError && /RASTER_AGENT_CMD/.test(e.message)
    );
    assert.equal(
      fs.existsSync(worktreePath("raster", "lot-inexistant-pour-le-test", "")),
      false,
      "un refus ne doit laisser aucun worktree"
    );
  } finally {
    if (avant === undefined) delete process.env.RASTER_AGENT_CMD;
    else process.env.RASTER_AGENT_CMD = avant;
  }
});

test("la commande est découpée en respectant les guillemets", () => {
  const avant = process.env.RASTER_AGENT_CMD;
  process.env.RASTER_AGENT_CMD = 'node -e "un deux trois"';
  try {
    assert.deepEqual(agentCommand(), { cmd: "node", args: ["-e", "un deux trois"] });
  } finally {
    if (avant === undefined) delete process.env.RASTER_AGENT_CMD;
    else process.env.RASTER_AGENT_CMD = avant;
  }
});

test("AC-6 — aucun agent ne pousse : rien n'invoque push ni merge", () => {
  // `spawn.mjs` n'appelle pas git du tout — il délègue l'isolation à worktree.mjs.
  const src = read("raster/spawn.mjs");
  assert.ok(!/"git"|'git'/.test(src), "spawn.mjs ne doit pas invoquer git");

  // Dans worktree.mjs, seuls des verbes lus/locaux sont passés à git.
  const wt = read("raster/worktree.mjs");
  const verbes = [...wt.matchAll(/git\(\s*\[?\s*"([a-z-]+)"/g)].map((m) => m[1]);
  const interdits = verbes.filter((v) => ["push", "merge", "rebase", "fetch"].includes(v));
  assert.deepEqual(interdits, [], `verbe git interdit : ${interdits.join(", ")}`);
  assert.ok(verbes.length > 0, "aucune invocation git détectée — le test ne prouve rien");
});

test("AC-4 — aucun état d'exécution n'est écrit dans un fichier", () => {
  const src = read("raster/spawn.mjs");
  assert.ok(
    !/writeFileSync|appendFileSync/.test(src),
    "un processus mort laisserait un état menteur sur disque"
  );
});

test("le flag long-path est passé par commande, jamais posé en config", () => {
  const wt = read("raster/worktree.mjs");
  assert.ok(wt.includes('"-c", "core.longpaths=true"'), "flag absent");
  assert.ok(
    !/config[^\n]*core\.longpaths/.test(wt),
    "la config du dépôt ne doit pas être modifiée"
  );
});
