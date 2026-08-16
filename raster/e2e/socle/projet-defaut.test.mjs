/**
 * Preuve CH-02-CORRECTION — AC-1 · AC-2 · AC-3.
 * Run: node --test raster/e2e/socle/projet-defaut.test.mjs
 *
 * Le choix du projet par défaut est une fonction pure : on la teste sur des
 * listes construites, pas sur le dépôt.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SRC = path.join(REPO, "raster/sources/web/src");

/**
 * `App.tsx` est du TSX : on ne peut pas l'importer sous `node --test`.
 * On extrait la fonction et on l'évalue — elle ne dépend que de ses arguments,
 * c'est justement ce qui la rend testable.
 */
function chargerProjetPorteur() {
  const src = fs.readFileSync(path.join(SRC, "App.tsx"), "utf8");
  const m = src.match(
    /export function projetPorteur\([\s\S]*?\n\}/
  );
  assert.ok(m, "projetPorteur introuvable dans App.tsx");
  const js = m[0]
    .replace("export function", "function")
    .replace(/:\s*string\[\]/g, "")
    .replace(/:\s*Task\[\]/g, "")
    .replace(/\)\s*:\s*string\s*\{/, ") {")
    .replace(/new Map<string, number>\(\)/, "new Map()");
  return new Function(`${js}; return projetPorteur;`)();
}

const projetPorteur = chargerProjetPorteur();
const t = (project) => ({ project });

test("AC-2 — le projet retenu porte du travail", () => {
  const projects = ["a-vide", "b-plein", "c-vide"];
  const tasks = [t("b-plein"), t("b-plein")];
  assert.equal(projetPorteur(projects, tasks), "b-plein");
});

test("AC-2 — l'ordre des projets départage, pas le volume", () => {
  const projects = ["a", "b"];
  const tasks = [t("b"), t("b"), t("a")];
  assert.equal(projetPorteur(projects, tasks), "a", "le premier qui porte gagne");
});

test("AC-3 — tous vides : le premier, sans erreur", () => {
  assert.equal(projetPorteur(["x", "y"], []), "x");
});

test("AC-3 — aucun projet : chaîne vide, pas d'exception", () => {
  assert.equal(projetPorteur([], []), "");
});

test("une task d'un projet absent de la liste ne le fait pas élire", () => {
  assert.equal(projetPorteur(["a", "b"], [t("fantome")]), "a");
});

test("AC-1 — aucun nom de projet en dur dans le front", () => {
  for (const f of fs.readdirSync(SRC)) {
    if (!/\.tsx?$/.test(f)) continue;
    const src = fs.readFileSync(path.join(SRC, f), "utf8");
    const durs = [...src.matchAll(/"(raster|sektor|nafura-platform)"/g)].map((m) => m[0]);
    assert.deepEqual(durs, [], `${f} code un nom de projet en dur : ${durs.join(", ")}`);
  }
});
