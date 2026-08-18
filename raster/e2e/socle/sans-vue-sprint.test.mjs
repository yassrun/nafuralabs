/**
 * Preuve CH-03 — AC-1…4 : plus de vue Sprint, bouton, route, ni champ DTO.
 * Run: node --test raster/e2e/socle/sans-vue-sprint.test.mjs
 *
 * Échoue si `commit-sprint`, `commitSprint`, ViewId `"sprint"` ou le libellé
 * `→ Sprint` réapparaissent dans le chrome ou l'API locale.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p) => fs.readFileSync(path.join(REPO, p), "utf8");

const APP = "raster/sources/web/src/App.tsx";
const FRONT = "raster/sources/web/src/api.ts";
const API = "raster/sources/web/server/raster-api.ts";

test("AC-1 — plus de vue Sprint ni de ViewId sprint", () => {
  const app = read(APP);
  const front = read(FRONT);
  assert.ok(!/\|\s*"sprint"/.test(front), `${FRONT} : ViewId contient encore "sprint"`);
  assert.ok(
    !/\["sprint",\s*"Sprint"/.test(app),
    `${APP} : entrée nav Sprint encore présente`
  );
  assert.ok(!/view === "sprint"/.test(app), `${APP} : panneau view === "sprint"`);
  assert.ok(!/isSprintRow/.test(app), `${APP} : isSprintRow encore là`);
  assert.ok(
    !/orchestrateur · \{sprint\}/.test(app),
    `${APP} : chrome affiche encore la semaine ISO`
  );
});

test("AC-2 — plus de bouton → Sprint, ni pastille, ni commit", () => {
  const app = read(APP);
  assert.ok(!/→ Sprint/.test(app), `${APP} : libellé → Sprint encore présent`);
  assert.ok(!/api\.commitSprint/.test(app), `${APP} : onCommit encore branché`);
  assert.ok(
    !/Commit = <code>sprint:/.test(app),
    `${APP} : Backlog dit encore Commit = sprint:`
  );
  assert.ok(!/task\.sprint/.test(app), `${APP} : pastille task.sprint encore là`);
});

test("AC-3 — plus de route commit-sprint ni de commitSprint client", () => {
  const api = read(API);
  const front = read(FRONT);
  assert.ok(!/commit-sprint/.test(api), `${API} : route commit-sprint encore là`);
  assert.ok(!/function setSprint/.test(api), `${API} : stub setSprint encore là`);
  assert.ok(
    !/b\.sprint !== undefined/.test(api),
    `${API} : PATCH accepte encore sprint`
  );
  assert.ok(!/commitSprint/.test(front), `${FRONT} : api.commitSprint encore là`);
  assert.ok(
    !/sprint\?:\s*string/.test(front),
    `${FRONT} : patchTask accepte encore sprint`
  );
});

test("AC-4 — le DTO de task ne porte plus sprint", () => {
  const api = read(API);
  const front = read(FRONT);
  assert.ok(!/sprint:\s*string/.test(front), `${FRONT} : Task porte encore sprint`);
  assert.ok(!/sprint:\s*string/.test(api), `${API} : TaskDto porte encore sprint`);
  assert.ok(!/fm\.sprint/.test(api), `${API} : loadTasks lit encore fm.sprint`);
  assert.ok(
    !/sprint:\s*isoWeekInfo/.test(api),
    `${API} : GET /api/meta renvoie encore sprint`
  );
});
