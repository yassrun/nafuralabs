#!/usr/bin/env node
/**
 * raster ready — quels sous-lots sont lançables maintenant.
 *
 * Grain = le sous-lot (`AGENTS.md` §7). C'est ce que l'orchestrateur lance ;
 * à l'intérieur les tasks sont en SÉRIE, donc une readiness par task calculerait
 * une précision que personne ne consomme.
 *
 * Deux notions de blocage, deux rôles disjoints :
 *   `blocked_by:`     interne au sous-lot  → ordre seulement, jamais un blocage
 *                     hors du sous-lot     → bloque le sous-lot tant que c'est ouvert
 *   `status: blocked` externe (hors Raster) → bloque, quoi qu'il arrive
 *
 * Rien n'est stocké : la readiness se recalcule (§2, pas de dérivé en frontmatter).
 *
 *   node raster/t.mjs ready [projet] [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectTaskFiles, treeFromPath } from "./walk-tasks.mjs";
import { parseFrontmatter } from "./regen.mjs";
import { parseListField } from "./agent-type.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

/** Une task est close quand plus personne n'attend après elle. */
const CLOSED = new Set(["done-agent", "done-me", "done"]);

export function loadForReadiness() {
  const tasks = [];
  for (const file of collectTaskFiles(REPO_ROOT)) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm?.id) continue;
    const { project, lot, souslot } = treeFromPath(REPO_ROOT, file);
    tasks.push({
      id: fm.id,
      status: fm.status || "todo",
      gate: fm.gate || "none",
      blocked_by: parseListField(fm.blocked_by),
      title: fm._title,
      project,
      lot,
      souslot,
      key: `${project}//${lot}//${souslot}`,
    });
  }
  return tasks;
}

/**
 * Retourne un groupe par sous-lot, avec son verdict.
 * `ouvert` = il reste du travail. Un groupe clos n'est jamais « lançable » :
 * il n'y a rien à lancer.
 */
export function readiness(projet = "") {
  return computeReadiness(loadForReadiness(), projet);
}

/** Pur : prend les tasks, rend les groupes. Testable sans dépôt. */
export function computeReadiness(tasks, projet = "") {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const groups = new Map();

  for (const t of tasks) {
    if (projet && t.project !== projet) continue;
    if (!groups.has(t.key)) {
      groups.set(t.key, {
        key: t.key,
        project: t.project,
        lot: t.lot,
        souslot: t.souslot,
        tasks: [],
      });
    }
    groups.get(t.key).tasks.push(t);
  }

  const out = [];
  for (const g of groups.values()) {
    const ouvert = g.tasks.some((t) => !CLOSED.has(t.status));
    const externes = g.tasks.filter((t) => t.status === "blocked");
    const attend = [];
    const inconnus = [];

    for (const t of g.tasks) {
      if (CLOSED.has(t.status)) continue;
      for (const dep of t.blocked_by) {
        const d = byId.get(dep);
        if (!d) {
          inconnus.push(dep);
          continue;
        }
        // Interne au sous-lot : c'est de l'ordre, pas un blocage.
        if (d.key === g.key) continue;
        if (!CLOSED.has(d.status)) attend.push(d);
      }
    }

    const raisons = [];
    if (!ouvert) raisons.push("clos");
    for (const e of externes) raisons.push(`${e.id} bloqué dehors`);
    for (const d of attend) raisons.push(`attend ${d.id}`);
    for (const i of inconnus) raisons.push(`bloqueur inconnu ${i}`);

    out.push({
      ...g,
      ouvert,
      lancable: ouvert && raisons.length === 0,
      raisons: [...new Set(raisons)],
      restant: g.tasks.filter((t) => !CLOSED.has(t.status)).length,
      gates: g.tasks.filter((t) => t.gate === "me" && !CLOSED.has(t.status)).map((t) => t.id),
    });
  }

  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export function formatReadiness(rows) {
  if (!rows.length) return "aucun sous-lot";
  const lines = [];
  for (const r of rows) {
    if (!r.ouvert) continue;
    const où = [r.project, r.lot, r.souslot].filter(Boolean).join(" / ");
    const mark = r.lancable ? "▸" : "✕";
    const why = r.lancable ? `${r.restant} task(s)` : r.raisons.join(" · ");
    lines.push(`${mark}  ${où.padEnd(52)} ${why}`);
  }
  const n = rows.filter((r) => r.lancable).length;
  lines.push(``, `ready — ${n} sous-lot(s) lançable(s) sur ${rows.filter((r) => r.ouvert).length} ouvert(s)`);
  return lines.join("\n");
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  const args = process.argv.slice(2).filter((a) => a !== "--json");
  const rows = readiness(args[0] || "");
  if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
  else console.log(formatReadiness(rows));
}
