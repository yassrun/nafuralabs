import assert from "node:assert/strict";
import test from "node:test";
import { computeSessionFront, harnessBrief } from "../../session-front.mjs";
import {
  availableModes,
  executionCommand,
  normalizeMode,
} from "../../execution-mode.mjs";

const task = (id, agent_type, over = {}) => ({
  id,
  agent_type,
  status: "todo",
  blocked_by: [],
  title: id,
  file: `${id}.md`,
  ...over,
});

test("les modes sont fermés et leurs commandes restent dans l'environnement", () => {
  assert.equal(normalizeMode("local"), "local");
  assert.equal(normalizeMode("agents"), "agents");
  assert.throws(() => normalizeMode("magique"));
  const env = {
    RASTER_LOCAL_CMD: 'node "local runner.mjs"',
    RASTER_AGENTS_CMD: 'node "agents runner.mjs"',
  };
  assert.deepEqual(executionCommand("local", env), {
    cmd: "node",
    args: ["local runner.mjs"],
  });
  assert.deepEqual(executionCommand("agents", env), {
    cmd: "node",
    args: ["agents runner.mjs"],
  });
  assert.deepEqual(availableModes(env), { local: true, agents: true });
});

test("le runner SDK intégré s'active avec les variables nécessaires", () => {
  assert.equal(executionCommand("local", {}), null);
  assert.equal(
    executionCommand("agents", { CURSOR_API_KEY: "x" }),
    null,
    "le cloud exige un dépôt connecté"
  );
  const local = executionCommand("local", { CURSOR_API_KEY: "x" });
  const agents = executionCommand("agents", {
    CURSOR_API_KEY: "x",
    RASTER_CLOUD_REPO: "https://github.com/acme/repo",
  });
  assert.equal(local.cmd, process.execPath);
  assert.match(local.args[0], /cursor-runner\.mjs$/);
  assert.equal(agents.args.at(-1), "agents");
});

test("Spec passe toujours avant Code", () => {
  const tasks = [task("S-1", "spec"), task("C-1", "exec")];
  assert.deepEqual(
    computeSessionFront(tasks, "agents").tasks.map((row) => row.id),
    ["S-1"]
  );
  assert.equal(computeSessionFront(tasks, "agents").phase, "spec");
});

test("le mode local ne confie qu'une Task Code", () => {
  const front = computeSessionFront(
    [task("C-1", "exec"), task("C-2", "exec")],
    "local"
  );
  assert.equal(front.phase, "code");
  assert.equal(front.parallel, false);
  assert.deepEqual(front.tasks.map((row) => row.id), ["C-1"]);
});

test("le mode agents expose en parallèle les Tasks Code indépendantes", () => {
  const front = computeSessionFront(
    [
      task("C-1", "exec"),
      task("C-2", "exec"),
      task("C-3", "exec", { blocked_by: ["C-1"] }),
    ],
    "agents"
  );
  assert.equal(front.parallel, true);
  assert.deepEqual(front.tasks.map((row) => row.id), ["C-1", "C-2"]);
});

test("une dépendance done ouvre la vague suivante", () => {
  const front = computeSessionFront(
    [
      task("C-1", "exec", { status: "done" }),
      task("C-2", "exec", { blocked_by: ["C-1"] }),
    ],
    "agents"
  );
  assert.deepEqual(front.tasks.map((row) => row.id), ["C-2"]);
});

test("le brief rend le contrat du harness explicite", () => {
  const brief = harnessBrief({
    project: "p",
    lot: "l",
    souslot: "s",
    mode: "agents",
    tasks: [task("C-1", "exec"), task("C-2", "exec")],
  });
  assert.match(brief, /Pipeline: Spec → Code → Done/);
  assert.match(brief, /mode: agents/);
  assert.match(brief, /parallèle: oui/);
  assert.match(brief, /C-1/);
  assert.match(brief, /C-2/);
});
