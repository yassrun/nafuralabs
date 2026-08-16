/**
 * Preuve CH-02 — AC-4 : la readiness au grain du sous-lot.
 * Run: node --test raster/e2e/work/readiness.test.mjs
 *
 * `computeReadiness` est pur : on lui donne des tasks, pas un dépôt.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { computeReadiness } from "../../ready.mjs";

const t = (id, souslot, over = {}) => ({
  id,
  status: "todo",
  gate: "none",
  blocked_by: [],
  title: id,
  project: "p",
  lot: "L",
  souslot,
  key: `p//L//${souslot}`,
  ...over,
});

const par = (rows, souslot) => rows.find((r) => r.souslot === souslot);

test("AC-4 — un blocked_by INTERNE n'empêche pas le sous-lot", () => {
  const rows = computeReadiness([t("A-1", "CH-A"), t("A-2", "CH-A", { blocked_by: ["A-1"] })]);
  assert.equal(par(rows, "CH-A").lancable, true, "l'ordre interne n'est pas un blocage");
});

test("AC-4 — un blocked_by EXTERNE ouvert bloque le sous-lot", () => {
  const rows = computeReadiness([
    t("A-1", "CH-A"),
    t("B-1", "CH-B", { blocked_by: ["A-1"] }),
  ]);
  assert.equal(par(rows, "CH-A").lancable, true);
  assert.equal(par(rows, "CH-B").lancable, false);
  assert.ok(par(rows, "CH-B").raisons.some((r) => r.includes("A-1")));
});

test("AC-4 — un blocked_by externe CLOS ne bloque plus", () => {
  for (const clos of ["done-agent", "done-me", "done"]) {
    const rows = computeReadiness([
      t("A-1", "CH-A", { status: clos }),
      t("B-1", "CH-B", { blocked_by: ["A-1"] }),
    ]);
    assert.equal(par(rows, "CH-B").lancable, true, `bloqueur ${clos}`);
  }
});

test("AC-4 — `status: blocked` (externe) bloque, sans aucun blocked_by", () => {
  const rows = computeReadiness([t("A-1", "CH-A", { status: "blocked" }), t("A-2", "CH-A")]);
  assert.equal(par(rows, "CH-A").lancable, false);
  assert.ok(par(rows, "CH-A").raisons.some((r) => r.includes("dehors")));
});

test("un sous-lot entièrement clos n'est ni ouvert ni lançable", () => {
  const rows = computeReadiness([t("A-1", "CH-A", { status: "done-agent" })]);
  assert.equal(par(rows, "CH-A").ouvert, false);
  assert.equal(par(rows, "CH-A").lancable, false);
});

test("un bloqueur inconnu bloque — il ne s'ignore pas en silence", () => {
  const rows = computeReadiness([t("A-1", "CH-A", { blocked_by: ["DISPARU-1"] })]);
  assert.equal(par(rows, "CH-A").lancable, false);
  assert.ok(par(rows, "CH-A").raisons.some((r) => r.includes("inconnu")));
});

test("les gate:me ouvertes sont remontées par sous-lot", () => {
  const rows = computeReadiness([t("A-1", "CH-A", { gate: "me" }), t("A-2", "CH-A")]);
  assert.deepEqual(par(rows, "CH-A").gates, ["A-1"]);
});

test("le filtre projet ne laisse passer que le projet demandé", () => {
  const rows = computeReadiness(
    [t("A-1", "CH-A"), { ...t("Z-1", "CH-Z"), project: "autre", key: "autre//L//CH-Z" }],
    "p"
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].project, "p");
});
