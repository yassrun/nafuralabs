/**
 * Preuve CH-03-CORRECTION — AC-1 · AC-2 · AC-3.
 * Run: node --test raster/e2e/work/sweep-refs.test.mjs
 *
 * `stripBlockedBy` travaille sur du texte, pas sur des fichiers : on peut donc
 * prouver le nettoyage sans balayer quoi que ce soit.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { stripBlockedBy } from "../../sweep.mjs";

const task = (bl) =>
  [
    "---",
    "id: A-1",
    "status: todo",
    ...(bl === null ? [] : [`blocked_by: ${bl}`]),
    "tags: [x]",
    "---",
    "",
    "# Titre",
    "",
  ].join("\n");

test("AC-1 — l'id supprimé quitte le blocked_by, les autres restent", () => {
  const out = stripBlockedBy(task("[A-2, A-3]"), ["A-2"]);
  assert.match(out, /^blocked_by: \[A-3\]$/m);
  assert.ok(!out.includes("A-2"));
});

test("AC-3 — vidé de tous ses ids, le champ disparaît", () => {
  const out = stripBlockedBy(task("[A-2]"), ["A-2"]);
  assert.ok(!/blocked_by/.test(out), "un blocked_by: [] résiduel ment sur l'histoire");
  assert.match(out, /^id: A-1$/m, "le reste du frontmatter est intact");
  assert.match(out, /^tags: \[x\]$/m);
});

test("rien à retirer ⇒ rien à écrire", () => {
  assert.equal(stripBlockedBy(task("[A-9]"), ["A-2"]), null);
  assert.equal(stripBlockedBy(task(null), ["A-2"]), null, "pas de champ, pas de patch");
});

test("plusieurs ids partent d'un coup", () => {
  const out = stripBlockedBy(task("[A-2, A-3, A-4]"), ["A-2", "A-4"]);
  assert.match(out, /^blocked_by: \[A-3\]$/m);
});

test("le corps de la task n'est jamais touché", () => {
  const src = task("[A-2]") + "\n## Journal\n```\nblocked_by: piège\n```\n";
  const out = stripBlockedBy(src, ["A-2"]);
  assert.ok(out.includes("blocked_by: piège"), "seul le frontmatter est patché");
});
