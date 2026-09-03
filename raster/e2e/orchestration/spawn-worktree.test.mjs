/**
 * Preuve Raster— preuve 1 · preuve 2 · preuve 6.
 * Run: node --test raster/e2e/orchestration/spawn-worktree.test.mjs
 *
 * Tout ce qui est testé ici REFUSE avant de toucher à git : aucun worktree n'est
 * créé, aucun processus n'est lancé. Les preuves qui demandent un vrai worktree
 * (preuve 3 double lancement, preuve 4 libération, preuve 5 arrêt) sont dans le rapport de
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
import {
  agentCommand,
  applyRunnerResult,
  configuredModes,
  start,
  SpawnError,
} from "../../spawn.mjs";

const read = (p) => fs.readFileSync(path.join(REPO_ROOT, p), "utf8");

test("preuve 1 — le worktree par défaut est hors du dépôt", () => {
  delete process.env.RASTER_WORKTREES;
  assert.equal(insideRepo(worktreeRoot()), false);
  assert.equal(insideRepo(worktreePath("raster", "socle", "panneau-decision")), false);
});

test("preuve 1 — un emplacement DANS le dépôt est refusé", () => {
  const avant = process.env.RASTER_WORKTREES;
  process.env.RASTER_WORKTREES = path.join(REPO_ROOT, "raster", "wt");
  try {
    assert.equal(insideRepo(worktreePath("raster", "socle", "panneau-decision")), true);
    assert.throws(
      () => addWorktree("raster", "socle", "panneau-decision"),
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
  assert.equal(branchName("socle", "panneau-decision"), "socle/panneau-decision");
  assert.equal(branchName("socle", ""), "lot/socle");
});

test("preuve 2 — sans RASTER_AGENT_CMD, il n'y a pas de commande", () => {
  const avant = process.env.RASTER_AGENT_CMD;
  const avantLocal = process.env.RASTER_LOCAL_CMD;
  const avantKey = process.env.CURSOR_API_KEY;
  delete process.env.RASTER_AGENT_CMD;
  delete process.env.RASTER_LOCAL_CMD;
  delete process.env.CURSOR_API_KEY;
  try {
    assert.equal(agentCommand(), null);
    process.env.RASTER_AGENT_CMD = "   ";
    assert.equal(agentCommand(), null, "une valeur blanche ne compte pas");
  } finally {
    if (avant === undefined) delete process.env.RASTER_AGENT_CMD;
    else process.env.RASTER_AGENT_CMD = avant;
    if (avantLocal === undefined) delete process.env.RASTER_LOCAL_CMD;
    else process.env.RASTER_LOCAL_CMD = avantLocal;
    if (avantKey === undefined) delete process.env.CURSOR_API_KEY;
    else process.env.CURSOR_API_KEY = avantKey;
  }
});

test("preuve 2 — le spawn refuse, et refuse AVANT de créer un worktree", () => {
  const avant = process.env.RASTER_AGENT_CMD;
  const avantLocal = process.env.RASTER_LOCAL_CMD;
  const avantKey = process.env.CURSOR_API_KEY;
  delete process.env.RASTER_AGENT_CMD;
  delete process.env.RASTER_LOCAL_CMD;
  delete process.env.CURSOR_API_KEY;
  try {
    assert.throws(
      () => start({ project: "raster", lot: "lot-inexistant-pour-le-test", brief: "x" }),
      (e) => e instanceof SpawnError && /RASTER_LOCAL_CMD/.test(e.message)
    );
    assert.equal(
      fs.existsSync(worktreePath("raster", "lot-inexistant-pour-le-test", "")),
      false,
      "un refus ne doit laisser aucun worktree"
    );
  } finally {
    if (avant === undefined) delete process.env.RASTER_AGENT_CMD;
    else process.env.RASTER_AGENT_CMD = avant;
    if (avantLocal === undefined) delete process.env.RASTER_LOCAL_CMD;
    else process.env.RASTER_LOCAL_CMD = avantLocal;
    if (avantKey === undefined) delete process.env.CURSOR_API_KEY;
    else process.env.CURSOR_API_KEY = avantKey;
  }
});

test("les modes local et agents ont des commandes séparées", () => {
  const local = process.env.RASTER_LOCAL_CMD;
  const agents = process.env.RASTER_AGENTS_CMD;
  const legacy = process.env.RASTER_AGENT_CMD;
  process.env.RASTER_LOCAL_CMD = 'node "local runner.mjs"';
  process.env.RASTER_AGENTS_CMD = 'node "cloud runner.mjs"';
  delete process.env.RASTER_AGENT_CMD;
  try {
    assert.deepEqual(agentCommand("local"), { cmd: "node", args: ["local runner.mjs"] });
    assert.deepEqual(agentCommand("agents"), { cmd: "node", args: ["cloud runner.mjs"] });
    assert.deepEqual(configuredModes(), { local: true, agents: true });
  } finally {
    if (local === undefined) delete process.env.RASTER_LOCAL_CMD;
    else process.env.RASTER_LOCAL_CMD = local;
    if (agents === undefined) delete process.env.RASTER_AGENTS_CMD;
    else process.env.RASTER_AGENTS_CMD = agents;
    if (legacy === undefined) delete process.env.RASTER_AGENT_CMD;
    else process.env.RASTER_AGENT_CMD = legacy;
  }
});

test("un runner ne peut muter que les Tasks de sa vague", () => {
  const calls = [];
  const count = applyRunnerResult(
    'RASTER_RESULT {"done":["RAS-1","HORS-1"],"blocked":["RAS-2"]}',
    ["RAS-1", "RAS-2"],
    (id, status) => calls.push([id, status])
  );
  assert.equal(count, 2);
  assert.deepEqual(calls, [
    ["RAS-1", "done"],
    ["RAS-2", "blocked"],
  ]);
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

test("preuve 6 — aucun agent ne pousse : rien n'invoque push ni merge", () => {
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

test("preuve 4 — aucun état d'exécution n'est écrit dans un fichier", () => {
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
