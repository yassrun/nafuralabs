#!/usr/bin/env node
/**
 * raster roadmap — la fenêtre de travail et sa borne.
 *
 * `<projet>/ROADMAP.md` est écrite à la main, hors `raster-src/`, jamais indexée.
 * Un marqueur `<!-- borne -->` la coupe en deux : au-dessus, l'orchestrateur peut
 * ouvrir seul ; en dessous, non.
 *
 * LE DÉFAUT EST FERMÉ (`pact/orchestration/SPEC.md` INV-2). Pas de fichier, pas de
 * marqueur, marqueur en tête : fenêtre VIDE. Un fichier mal formé ne doit jamais
 * élargir l'autonomie — l'erreur sûre est de ne rien lancer.
 *
 *   node raster/t.mjs window [projet] [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listRasterProjects } from "./walk-tasks.mjs";
import { readiness } from "./ready.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

const BORNE = /<!--\s*borne\s*-->/i;

/** Un lot cité : `**slug**` ou `` `slug` `` en tête de point numéroté. */
function lotsCités(bloc) {
  const out = [];
  for (const line of bloc.split(/\r?\n/)) {
    const m = line.match(/^\s*\d+\.\s+\*\*([a-z0-9][a-z0-9_-]*)\*\*/i);
    if (m) out.push(m[1]);
  }
  return [...new Set(out)];
}

/**
 * Lit la roadmap d'un projet.
 * Retourne { fichier, borne, fenetre[], fermes[], note }.
 */
/** Pur : prend le markdown, rend la coupe. Testable sans dépôt. */
export function parseRoadmap(raw) {
  const m = raw.match(BORNE);
  if (!m) {
    return {
      borne: false,
      fenetre: [],
      fermes: lotsCités(raw),
      note: "pas de marqueur <!-- borne --> — fenêtre vide",
    };
  }
  const fenetre = lotsCités(raw.slice(0, m.index));
  return {
    borne: true,
    fenetre,
    fermes: lotsCités(raw.slice(m.index + m[0].length)),
    note: fenetre.length ? "" : "borne en tête — fenêtre vide",
  };
}

export function readRoadmap(project) {
  const file = path.join(REPO_ROOT, project, "ROADMAP.md");
  if (!fs.existsSync(file)) {
    return { project, fichier: null, borne: false, fenetre: [], fermes: [], note: "pas de ROADMAP.md — fenêtre vide" };
  }
  return {
    project,
    fichier: `${project}/ROADMAP.md`,
    ...parseRoadmap(fs.readFileSync(file, "utf8")),
  };
}

/**
 * La fenêtre croisée avec la readiness : ce qu'un orchestrateur peut lancer.
 * Un lot cité sans dossier `raster-src` est signalé, pas fatal — la roadmap a le
 * droit de porter ce qui n'existe pas encore.
 */
export function window_(project) {
  const road = readRoadmap(project);
  const rows = readiness(project);
  const parLot = new Map();
  for (const r of rows) {
    if (!parLot.has(r.lot)) parLot.set(r.lot, []);
    parLot.get(r.lot).push(r);
  }
  const lots = road.fenetre.map((lot) => {
    const groupes = parLot.get(lot) || [];
    return {
      lot,
      existe: groupes.length > 0,
      lancables: groupes.filter((g) => g.lancable),
      bloques: groupes.filter((g) => g.ouvert && !g.lancable),
    };
  });
  return { ...road, lots };
}

export function formatWindow(w) {
  const lines = [];
  lines.push(`fenêtre — ${w.project}${w.fichier ? ` · ${w.fichier}` : ""}`);
  if (w.note) lines.push(`  ${w.note}`);
  if (!w.lots.length) {
    lines.push("  aucun lot ouvert — rien à lancer");
    return lines.join("\n");
  }
  for (const l of w.lots) {
    if (!l.existe) {
      lines.push(`  ${l.lot} — pas encore de dossier raster-src (roadmap seule)`);
      continue;
    }
    lines.push(`  ${l.lot}`);
    for (const g of l.lancables) {
      lines.push(`    ▸ ${g.souslot || "(à plat)"}  ${g.restant} task(s)${g.gates.length ? `  gate:me ${g.gates.join(",")}` : ""}`);
    }
    for (const g of l.bloques) {
      lines.push(`    ✕ ${g.souslot || "(à plat)"}  ${g.raisons.join(" · ")}`);
    }
  }
  const n = w.lots.reduce((s, l) => s + l.lancables.length, 0);
  lines.push("", `window — ${n} sous-lot(s) lançable(s) dans la fenêtre`);
  return lines.join("\n");
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const projets = args.length ? args : listRasterProjects(REPO_ROOT);
  const out = projets.map((p) => window_(p));
  if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 2));
  else console.log(out.map(formatWindow).join("\n\n"));
}
