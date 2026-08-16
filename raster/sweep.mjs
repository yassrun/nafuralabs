#!/usr/bin/env node
/**
 * raster sweep — `done-me` sort du dépôt.
 *
 * Une task validée par l'humain est supprimée : Git porte l'histoire,
 * exactement comme pour la SPEC. Pas d'archive.
 *
 * Le compteur `raster-src/NEXT` de chaque projet garde la borne haute des IDs,
 * pour qu'un id supprimé ne soit jamais réattribué.
 *
 *   node raster/sweep.mjs [--dry]
 *   node raster/t.mjs sweep
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectTaskFiles, treeFromPath } from "./walk-tasks.mjs";
import { parseFrontmatter } from "./regen.mjs";
import { parseListField } from "./agent-type.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

const rel = (p) => path.relative(REPO_ROOT, p).replace(/\\/g, "/");

/** `<projet>/raster-src/NEXT` — un entier, monotone, jamais décrémenté. */
function bumpNext(rasterSrc, id) {
  const n = Number(String(id).replace(/^.*?-/, ""));
  if (!Number.isFinite(n)) return;
  const file = path.join(rasterSrc, "NEXT");
  const cur = fs.existsSync(file) ? Number(fs.readFileSync(file, "utf8").trim()) : 0;
  if (n > cur) fs.writeFileSync(file, `${n}\n`, "utf8");
}

/**
 * Retire des ids d'un `blocked_by`, sur le texte brut d'une task.
 * Rend `null` s'il n'y a rien à changer — l'appelant n'écrit pas pour rien.
 *
 * Un `blocked_by` vidé DISPARAÎT : un `blocked_by: []` résiduel dirait qu'une
 * dépendance a existé, alors que le champ n'a de sens que peuplé.
 */
export function stripBlockedBy(raw, ids) {
  // On ne touche QUE le frontmatter : un `blocked_by:` cité dans le journal
  // ou dans un rapport n'est pas un champ, c'est du texte.
  if (!raw.startsWith("---")) return null;
  const fin = raw.indexOf("\n---", 4);
  if (fin < 0) return null;
  const bloc = raw.slice(4, fin).replace(/\r/g, "");
  const reste = raw.slice(fin + 4);

  const partants = new Set(ids);
  let change = false;
  const lignes = [];
  for (const l of bloc.split("\n")) {
    const m = l.match(/^blocked_by:[ \t]*(.*)$/);
    if (!m) {
      lignes.push(l);
      continue;
    }
    const avant = parseListField(m[1]);
    const restants = avant.filter((x) => !partants.has(x));
    if (restants.length === avant.length) {
      lignes.push(l);
      continue;
    }
    change = true;
    // Vidé, le champ disparaît : `blocked_by: []` dirait qu'une dépendance existe.
    if (restants.length) lignes.push(`blocked_by: [${restants.join(", ")}]`);
  }
  return change ? `---\n${lignes.join("\n")}\n---${reste}` : null;
}

/**
 * Une task supprimée est une dépendance **satisfaite** : plus personne ne doit
 * l'attendre. Sans ce nettoyage, la readiness la reverrait comme un bloqueur
 * *inconnu* — donc bloquant — et le sous-lot deviendrait inlançable pour
 * toujours (`CH-03-CORRECTION-sweep-blocked-by`).
 *
 * Passe AVANT la suppression : interrompu au milieu, mieux vaut un fichier
 * encore là qu'une référence orpheline.
 */
export function cleanReferences(ids, { dry = false } = {}) {
  const partants = new Set(ids);
  const touches = [];
  for (const file of collectTaskFiles(REPO_ROOT, { includeArchive: true })) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseFrontmatter(raw);
    if (!fm || partants.has(fm.id)) continue;
    const next = stripBlockedBy(raw, ids);
    if (!next) continue;
    touches.push({ id: fm.id || "?", at: rel(file) });
    if (!dry) fs.writeFileSync(file, next, "utf8");
  }
  return touches;
}

/** Remonte en supprimant les dossiers devenus vides, sans sortir de lots/. */
function pruneEmpty(dir, stopAt) {
  let cur = dir;
  while (cur.startsWith(stopAt) && cur !== stopAt) {
    if (!fs.existsSync(cur)) {
      cur = path.dirname(cur);
      continue;
    }
    if (fs.readdirSync(cur).length) return;
    fs.rmdirSync(cur);
    cur = path.dirname(cur);
  }
}

export function sweep({ dry = false } = {}) {
  const partants = [];
  for (const file of collectTaskFiles(REPO_ROOT)) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm || fm.status !== "done-me") continue;
    const { project } = treeFromPath(REPO_ROOT, file);
    const m = file.replace(/\\/g, "/").match(/^(.*\/raster-src)\//);
    partants.push({
      id: fm.id || "?",
      at: rel(file),
      project,
      file,
      rasterSrc: m ? m[1] : null,
    });
  }

  // Les références d'abord, les fichiers ensuite.
  const nettoyes = cleanReferences(
    partants.map((p) => p.id).filter((id) => id !== "?"),
    { dry }
  );

  const removed = partants.map(({ id, at, project }) => ({ id, at, project }));
  if (dry) return Object.assign(removed, { nettoyes });

  for (const p of partants) {
    if (p.rasterSrc) bumpNext(p.rasterSrc, p.id);
    fs.rmSync(p.file);
    pruneEmpty(path.dirname(p.file), path.join(p.rasterSrc || "", "lots"));
  }
  return Object.assign(removed, { nettoyes });
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  const dry = process.argv.includes("--dry");
  const removed = sweep({ dry });
  for (const r of removed) console.log(`${dry ? "would remove" : "removed"}  ${r.id}  ${r.at}`);
  console.log(
    `\nsweep — ${removed.length} task(s) done-me ${dry ? "à supprimer" : "supprimée(s)"}. Git porte l'histoire.`
  );
}
