/**
 * Preuve Raster— preuve 1 · preuve 3 : une commande qui refuse n'écrit rien.
 * Run: node --test raster/e2e/work/ecriture-refus.test.mjs
 *
 * Les cas testés refusent AVANT toute écriture, donc les lancer sur le dépôt réel
 * est sans effet. Aucun cas d'écriture ici — voir readiness.test.mjs pour le pur.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createTask, setStatus, RefusError, slugify, TYPES } from "../../write.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CIBLE = "work/ecriture-et-readiness";

/** Empreinte du dossier de tasks — doit être identique après chaque refus. */
function empreinte() {
  const dir = path.join(REPO, "raster/raster-src/lots", CIBLE, "tasks");
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort().join("|") : "";
}

test("preuve 1 — un enum inconnu est refusé, et rien n'est écrit", () => {
  const avant = empreinte();
  for (const bad of [
    { type: "bidule" },
    { priority: "P9" },
    { assignee: "personne" },
    { gate: "peut-etre" },
    { context: "autre" },
  ]) {
    assert.throws(
      () => createTask({ project: "raster", target: CIBLE, title: "Refus", ...bad }),
      RefusError,
      `${JSON.stringify(bad)} aurait dû être refusé`
    );
  }
  assert.equal(empreinte(), avant);
});

test("preuve 1 — un lot inexistant est refusé sans --nouveau-lot", () => {
  const avant = empreinte();
  assert.throws(
    () => createTask({ project: "raster", target: "lot-qui-nexiste-pas", title: "Refus" }),
    RefusError
  );
  assert.equal(empreinte(), avant);
});

test("preuve 1 — un couple type/agent_type incohérent est refusé", () => {
  assert.throws(
    () =>
      createTask({
        project: "raster",
        target: CIBLE,
        title: "Refus",
        type: "tech",
        agent_type: "qa",
      }),
    RefusError
  );
  // Le couple cohérent, lui, passe la validation d'enums.
  assert.doesNotThrow(() => {
    for (const t of TYPES) {
      assert.ok(t.length > 0);
    }
  });
});

test("preuve 1 — un blocked_by inconnu est refusé", () => {
  const avant = empreinte();
  assert.throws(
    () =>
      createTask({
        project: "raster",
        target: CIBLE,
        title: "Refus",
        blocked_by: ["RAS-999999"],
      }),
    RefusError
  );
  assert.equal(empreinte(), avant);
});

test("preuve 1 — un titre vide est refusé", () => {
  assert.throws(
    () => createTask({ project: "raster", target: CIBLE, title: "   " }),
    RefusError
  );
});

test("preuve 3 — `done-me` ne se pose pas par `status`", () => {
  assert.throws(() => setStatus("RAS-79", "done-me"), RefusError);
  assert.throws(() => setStatus("RAS-79", "termine"), RefusError);
});

test("le slug est stable, sans accent ni ponctuation", () => {
  assert.equal(slugify("Écriture et readiness"), "ecriture-et-readiness");
  assert.equal(slugify("  "), "task");
  assert.ok(slugify("x".repeat(200)).length <= 48);
});
