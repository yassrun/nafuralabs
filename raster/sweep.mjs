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
  const removed = [];
  for (const file of collectTaskFiles(REPO_ROOT)) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm || fm.status !== "done-me") continue;

    const { project } = treeFromPath(REPO_ROOT, file);
    const m = file.replace(/\\/g, "/").match(/^(.*\/raster-src)\//);
    const rasterSrc = m ? m[1] : null;

    removed.push({ id: fm.id || "?", at: rel(file), project });
    if (dry) continue;

    if (rasterSrc) bumpNext(rasterSrc, fm.id);
    fs.rmSync(file);
    pruneEmpty(path.dirname(file), path.join(rasterSrc || "", "lots"));
  }
  return removed;
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
