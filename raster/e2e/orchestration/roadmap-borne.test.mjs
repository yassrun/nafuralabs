/**
 * Preuve Raster— preuve 2 : le défaut est FERMÉ.
 * Run: node --test raster/e2e/orchestration/roadmap-borne.test.mjs
 *
 * Un ROADMAP.md mal formé ne doit jamais élargir l'autonomie : l'erreur sûre
 * est de ne rien lancer.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { parseRoadmap } from "../../roadmap.mjs";

const ROADMAP = `# ROADMAP — essai

## Ouvert

1. **cadre** — fait
2. **work** — les commandes

<!-- borne -->

## Pas encore

3. **orchestration** — le spawn
4. **socle** — l'UI
`;

test("preuve 2 — la borne coupe la roadmap en deux", () => {
  const r = parseRoadmap(ROADMAP);
  assert.equal(r.borne, true);
  assert.deepEqual(r.fenetre, ["cadre", "work"]);
  assert.deepEqual(r.fermes, ["orchestration", "socle"]);
});

test("preuve 2 — sans marqueur, la fenêtre est VIDE (pas ouverte)", () => {
  const r = parseRoadmap(ROADMAP.replace("<!-- borne -->", ""));
  assert.equal(r.borne, false);
  assert.deepEqual(r.fenetre, [], "un fichier sans borne n'ouvre rien");
  assert.ok(r.note.includes("fenêtre vide"));
});

test("preuve 2 — borne en tête : fenêtre vide", () => {
  const r = parseRoadmap(`<!-- borne -->\n\n1. **work** — plus tard\n`);
  assert.equal(r.borne, true);
  assert.deepEqual(r.fenetre, []);
  assert.ok(r.note.includes("fenêtre vide"));
});

test("un fichier vide n'ouvre rien", () => {
  assert.deepEqual(parseRoadmap("").fenetre, []);
  assert.deepEqual(parseRoadmap("du texte sans lot\n").fenetre, []);
});

test("le marqueur tolère les espaces et la casse", () => {
  for (const m of ["<!-- borne -->", "<!--borne-->", "<!--  BORNE  -->"]) {
    const r = parseRoadmap(`1. **work** — x\n\n${m}\n\n2. **socle** — y\n`);
    assert.deepEqual(r.fenetre, ["work"], m);
  }
});

test("seuls les lots en gras d'une liste numérotée comptent", () => {
  const r = parseRoadmap(
    `1. **work** — oui\n- **socle** — non, pas numéroté\ntexte **gras** au fil\n\n<!-- borne -->\n`
  );
  assert.deepEqual(r.fenetre, ["work"]);
});
