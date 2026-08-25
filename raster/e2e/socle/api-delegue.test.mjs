/**
 * Preuve Raster— preuve 3 · preuve 5 · preuve 6.
 * Run: node --test raster/e2e/socle/api-delegue.test.mjs
 *
 * Ces trois critères sont **structurels** : ils disent ce que le code n'a plus le
 * droit de contenir. Un test de comportement ne les attraperait pas — un second
 * chemin d'écriture marche très bien, c'est justement le problème.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p) => fs.readFileSync(path.join(REPO, p), "utf8");

const API = "raster/sources/web/server/raster-api.ts";
const FRONT_API = "raster/sources/web/src/api.ts";
const APP = "raster/sources/web/src/App.tsx";

test("preuve 5 — le serveur n'écrit plus de task lui-même", () => {
  const src = read(API);
  const writes = [...src.matchAll(/fs\.writeFileSync\([^)]*/g)].map((m) => m[0]);
  // La capture d'inbox n'est pas une task : c'est la seule écriture tolérée.
  const horsInbox = writes.filter((w) => !w.includes("inbox.md"));
  assert.deepEqual(
    horsInbox,
    [],
    `écriture directe restante dans ${API} : ${horsInbox.join(" | ")}`
  );
});

test("preuve 5 — l'allocation d'id n'est plus dupliquée dans le serveur", () => {
  const src = read(API);
  assert.ok(!/nextIdForPrefix|PROJECT_PREFIX/.test(src), "id alloué côté serveur");
  assert.ok(!/setFrontmatterField/.test(src), "patch de frontmatter côté serveur");
});

test("preuve 5 — les mutations passent par les modules du CLI", () => {
  const src = read(API);
  for (const fn of ["createTask", "promoteLine", "setStatus", "approve"]) {
    assert.ok(src.includes(fn), `${fn} non importé par le serveur`);
  }
  assert.ok(src.includes("RefusError"), "un refus du CLI doit remonter en 400");
});

test("preuve 3 — aucun sélecteur ne propose done-me", () => {
  const app = read(APP);
  const choices = app.match(/STATUS_CHOICES[\s\S]*?\];/);
  assert.ok(choices, "STATUS_CHOICES introuvable");
  assert.ok(!choices[0].includes("done-me"), "done-me proposé dans un select");
  assert.ok(choices[0].includes("done-agent"), "done-agent doit rester posable");
});

test("preuve 3 — l'approbation existe et n'est pas un status déguisé", () => {
  assert.ok(read(FRONT_API).includes("/approve"), "route approve absente du client");
  assert.ok(read(APP).includes("onApprove"), "action Approuver absente de l'UI");
});

test("preuve 6 — aucun brief ne référence un skill inexistant", () => {
  const src = read(FRONT_API);
  const morts = [...src.matchAll(/nafura-(spec|exec|qa|orch)/g)].map((m) => m[0]);
  assert.deepEqual(morts, [], `skills fantômes cités : ${morts.join(", ")}`);
  assert.ok(
    fs.existsSync(path.join(REPO, ".claude/skills/orchestration/SKILL.md")),
    "le skill cité par les briefs doit exister"
  );
  for (const a of ["exec", "spec", "qa"]) {
    assert.ok(
      fs.existsSync(path.join(REPO, `.claude/agents/${a}.md`)),
      `.claude/agents/${a}.md manquant`
    );
  }
});

test("preuve 2 — le serveur expose les sections du corps du .md", () => {
  const src = read(API);
  assert.ok(/question:\s*section\(/.test(src), "section Question non exposée");
  assert.ok(/rapport:\s*section\(/.test(src), "section Rapport non exposée");
  assert.ok(read(APP).includes("task.rapport"), "le rapport n'est pas affiché");
});

test("preuve 1 — la vue Toi est dérivée, pas filtrée à la main", () => {
  assert.ok(read(API).includes("attend:"), "le champ `attend` doit venir du serveur");
  assert.ok(read(APP).includes("t.attend"), "la file d'attente doit s'appuyer dessus");
});
