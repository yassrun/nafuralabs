/**
 * Preuve Raster — chrome réduit à inbox, ready, session.
 * Run: node --test raster/e2e/socle/chrome-inbox-ready-session.test.mjs
 *
 * Échoue si Plan, Sous-lots, Livraisons ou la liste Projets récents
 * réapparaissent dans le chrome.
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
const CSS = "raster/sources/web/src/styles.css";

test("preuve 1 — ViewId ne contient que captures, ready, session", () => {
  const front = read(FRONT);
  assert.ok(/\|\s*"session"/.test(front), `${FRONT} : ViewId session manquant`);
  assert.ok(/\|\s*"ready"/.test(front), `${FRONT} : ViewId ready manquant`);
  assert.ok(/\|\s*"captures"/.test(front), `${FRONT} : ViewId captures manquant`);
  assert.ok(!/\|\s*"plan"/.test(front), `${FRONT} : ViewId plan encore présent`);
  assert.ok(!/\|\s*"sublot"/.test(front), `${FRONT} : ViewId sublot encore présent`);
  assert.ok(!/\|\s*"deliveries"/.test(front), `${FRONT} : ViewId deliveries encore présent`);
});

test("preuve 2 — plus de vues Plan, Sous-lots, Livraisons", () => {
  const app = read(APP);
  assert.ok(!/label: "Plan"/.test(app), `${APP} : entrée nav Plan encore présente`);
  assert.ok(!/label: "Sous-lots"/.test(app), `${APP} : entrée nav Sous-lots encore présente`);
  assert.ok(!/label: "Livraisons"/.test(app), `${APP} : entrée nav Livraisons encore présente`);
  assert.ok(!/function PlanView/.test(app), `${APP} : PlanView encore là`);
  assert.ok(!/function SubLotView/.test(app), `${APP} : SubLotView encore là`);
  assert.ok(!/function DeliveriesView/.test(app), `${APP} : DeliveriesView encore là`);
  assert.ok(!/view === "plan"/.test(app), `${APP} : panneau view === "plan"`);
  assert.ok(!/view === "sublot"/.test(app), `${APP} : panneau view === "sublot"`);
  assert.ok(!/view === "deliveries"/.test(app), `${APP} : panneau view === "deliveries"`);
  assert.ok(!/Voir le plan/.test(app), `${APP} : bouton Voir le plan encore présent`);
  assert.ok(!/onOpenPlan/.test(app), `${APP} : onOpenPlan encore branché`);
});

test("preuve 3 — plus de liste Projets récents / actifs dans la sidebar", () => {
  const app = read(APP);
  const css = read(CSS);
  assert.ok(!/Projets actifs/.test(app), `${APP} : label Projets actifs encore présent`);
  assert.ok(!/Projets récents/.test(app), `${APP} : label Projets récents encore présent`);
  assert.ok(!/className="rf-project"/.test(app), `${APP} : boutons rf-project encore présents`);
  assert.ok(!/\.rf-project\b/.test(css), `${CSS} : styles rf-project encore présents`);
  assert.ok(!/\.rf-plan-grid\b/.test(css), `${CSS} : styles Plan encore présents`);
  assert.ok(!/\.rf-sub-grid\b/.test(css), `${CSS} : styles Sous-lots encore présents`);
  assert.ok(!/\.rf-delivery-list\b/.test(css), `${CSS} : styles Livraisons encore présents`);
});

test("preuve 4 — le chrome restant expose inbox, ready et session", () => {
  const app = read(APP);
  assert.ok(/id: "captures"/.test(app), `${APP} : nav Captures / inbox manquant`);
  assert.ok(/id: "ready"/.test(app), `${APP} : nav Ready manquant`);
  assert.ok(/id: "session"/.test(app), `${APP} : nav Session manquant`);
  assert.ok(/function SessionView/.test(app), `${APP} : SessionView manquant`);
  assert.ok(/function ReadyView/.test(app), `${APP} : ReadyView manquant`);
  assert.ok(/function CaptureView/.test(app), `${APP} : CaptureView manquant`);
});

test("preuve 5 — Ready et Session sont disjoints", () => {
  const app = read(APP);
  assert.ok(/engagedKeys/.test(app), `${APP} : engagedKeys manquant`);
  assert.ok(/!engagedKeys\.has\(row\.key\)/.test(app), `${APP} : Ready doit exclure les engagés`);
  assert.ok(/engagedKeys\.has\(group\.key\)/.test(app), `${APP} : Session doit lister les engagés`);
  assert.ok(/commitSession/.test(app), `${APP} : passage Ready → Session manquant`);
});
