#!/usr/bin/env node
/**
 * Regen Raster orchestrator views from product lot tasks.
 * Walks every NafuraLabs project (IT or not):
 *   - <projet>/raster-src/lots/.../tasks/*.md   (seul scan — peers à la racine)
 * Projet Raster = raster/ (scanné via raster/raster-src/).
 * Sync: any task file on a project appears in INDEX/BACKLOG after regen.
 * Skips: lots/_archive
 * Writes: INDEX.tsv, SPRINT.md, BACKLOG.md under repo-root raster/ (orchestrateur)
 *
 *   node raster/regen.mjs
 *   node raster/t.mjs index
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectTaskFiles, treeFromPath } from "./walk-tasks.mjs";
import { inferWorkType, resolveAgentType } from "./agent-type.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

const STATUS_ORDER = { doing: 0, review: 1, blocked: 2, todo: 3, "done-agent": 4, "done-me": 5, done: 6 };
const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };
const GLYPH = { todo: "·", doing: "▸", blocked: "✕", review: "◐", "done-agent": "✓", "done-me": "✓", done: "✓" };

export function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) return null;
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return null;
  const block = raw.slice(4, end).replace(/\r/g, "");
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const fm = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    fm[m[1]] = v;
  }
  const h1 = body.match(/^#\s+(.+)$/m);
  fm._title = h1 ? h1[1].trim() : fm.id || "untitled";
  return fm;
}

function shortTitle(title) {
  let t = title
    .replace(/^Feature\s+[—–-]\s+/i, "")
    .replace(/^Bug\s+[—–-]\s+/i, "Bug — ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > 48) t = t.slice(0, 45) + "…";
  return t;
}

function loadTasks() {
  const files = collectTaskFiles(REPO_ROOT);
  const tasks = [];
  for (const file of files) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm?.id) continue;
    if (fm.status === "done" || fm.status === "done-me") continue;
    const { project, lot, souslot } = treeFromPath(REPO_ROOT, file);
    const type = inferWorkType(fm);
    const agent_type = resolveAgentType(type, fm.agent_type);
    tasks.push({
      id: fm.id,
      status: fm.status || "todo",
      priority: fm.priority || "P3",
      context: fm.context || "nafura",
      assignee: fm.assignee || "",
      gate: fm.gate || "",
      type,
      agent_type,
      sprint: fm.sprint || "",
      blocked_by: fm.blocked_by || "",
      title: shortTitle(fm._title),
      titleFull: fm._title,
      project,
      lot,
      souslot,
      file,
    });
  }
  return tasks;
}

/** Tout fichier sous `tasks/` est une task. Les chapeaux sont des dossiers. */

/** Statut dérivé d'un chapeau : ✓ ssi toutes ses tasks live sont done-agent. */
function hatDone(list) {
  return list.length > 0 && list.every((t) => t.status === "done-agent");
}

function sortTasks(a, b) {
  const sa = STATUS_ORDER[a.status] ?? 9;
  const sb = STATUS_ORDER[b.status] ?? 9;
  if (sa !== sb) return sa - sb;
  const pa = PRIORITY_ORDER[a.priority] ?? 9;
  const pb = PRIORITY_ORDER[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  const ka = `${a.lot}/${a.souslot}`;
  const kb = `${b.lot}/${b.souslot}`;
  if (ka !== kb) return ka < kb ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function isoWeekInfo(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  const year = date.getUTCFullYear();
  const monday = new Date(d);
  const dow = monday.getDay() || 7;
  monday.setDate(monday.getDate() - dow + 1);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x) =>
    `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
  return {
    id: `${year}-W${week}`,
    label: `lun ${fmt(monday)} → dim ${fmt(sunday)}`,
  };
}

function writeIndex(tasks) {
  const sorted = [...tasks].sort(sortTasks);
  const header =
    "id\tstatus\tpriority\tcontext\tassignee\tgate\ttype\tagent_type\tsprint\tproject\tlot\tsouslot\ttitle";
  const rows = sorted.map((t) =>
    [
      t.id,
      t.status,
      t.priority,
      t.context,
      t.assignee,
      t.gate,
      t.type,
      t.agent_type,
      t.sprint,
      t.project,
      t.lot,
      t.souslot,
      t.title,
    ].join("\t")
  );
  fs.writeFileSync(
    path.join(RASTER_ROOT, "INDEX.tsv"),
    [header, ...rows].join("\n") + "\n",
    "utf8"
  );
  return sorted.length;
}

function padId(id) {
  return id.padEnd(7);
}

function writeSprint(tasks) {
  const { id, label } = isoWeekInfo();
  const committed = tasks
    .filter(
      (t) =>
        t.sprint === id &&
        t.status !== "done-agent" &&
        t.status !== "done-me" &&
        t.status !== "done"
    )
    .sort(sortTasks);
  const readyP1 = tasks
    .filter((t) => !t.sprint && t.priority === "P1" && t.status === "todo")
    .sort(sortTasks);

  const lines = [`# SPRINT ${id}                         ${label}`, ""];

  if (committed.length === 0) {
    lines.push(`  (aucune tâche commitée — Commit = poser \`sprint: ${id}\`)`);
    lines.push("");
    if (readyP1.length) {
      lines.push("  tasks P1 prêtes (hors features) :");
      for (const t of readyP1) {
        const who = t.assignee ? `[${t.assignee}]` : "";
        const gate = t.gate ? `gate:${t.gate}` : "";
        const agent = t.agent_type ? t.agent_type : "";
        lines.push(
          `  ${GLYPH[t.status] || "·"} ${padId(t.id)}  ${t.title.padEnd(32).slice(0, 32)}  ${who.padEnd(8)}  ${agent.padEnd(5)}  ${gate}`
        );
      }
      lines.push("");
    }
  } else {
    for (const t of committed) {
      const who = t.assignee ? `[${t.assignee}]` : "";
      const gate = t.gate ? `gate:${t.gate}` : "";
      const agent = t.agent_type ? t.agent_type : "";
      lines.push(
        `${GLYPH[t.status] || "·"} ${padId(t.id)}  ${t.title.padEnd(32).slice(0, 32)}  ${t.priority}  ${who.padEnd(8)}  ${agent.padEnd(5)}  ${gate}`
      );
    }
    lines.push("");
  }

  const counts = {
    committed: committed.length,
    doing: committed.filter((t) => t.status === "doing").length,
    review: committed.filter((t) => t.status === "review").length,
    blocked: committed.filter((t) => t.status === "blocked").length,
  };
  lines.push(
    "  ────────────────────────────────────────────────────────────────"
  );
  lines.push(
    `  committed  ${counts.committed}   doing ${counts.doing}   review ${counts.review}   blocked ${counts.blocked}`
  );
  lines.push(
    "  ────────────────────────────────────────────────────────────────"
  );
  lines.push("");

  fs.writeFileSync(path.join(RASTER_ROOT, "SPRINT.md"), lines.join("\n"), "utf8");
}

function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function taskLine(t, indent) {
  const g = GLYPH[t.status] || "·";
  return `${indent} ${g} \`${t.id}\` ${t.type} — ${t.title}`;
}

/** Regroupe une liste de tasks par clé, en préservant l'ordre d'apparition trié. */
function groupBy(list, keyFn) {
  const map = new Map();
  for (const t of list) {
    const k = keyFn(t);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(t);
  }
  return map;
}

function writeBacklog(tasks) {
  const byProject = new Map();
  for (const t of tasks) {
    if (!byProject.has(t.project)) byProject.set(t.project, []);
    byProject.get(t.project).push(t);
  }

  const projectOrder = [...byProject.keys()].sort((a, b) => {
    const na = byProject.get(a).length;
    const nb = byProject.get(b).length;
    if (na !== nb) return nb - na;
    return a < b ? -1 : 1;
  });

  const lines = [
    "# BACKLOG (généré — ne pas éditer)",
    "",
    "> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.",
    "> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.",
    "> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.",
    "> Sprint = champ `sprint:` sur la **task** seulement.",
    "> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.",
    "> Inbox : `raster/inbox.md`.",
    "",
  ];

  for (const proj of projectOrder) {
    const list = [...byProject.get(proj)].sort(byId);

    lines.push(`## ${proj}`);
    lines.push("");

    const byLot = groupBy(list, (t) => t.lot);
    for (const lot of [...byLot.keys()].sort()) {
      const inLot = byLot.get(lot);
      if (lot) lines.push(`- \`${lot}\` lot`);

      const bySous = groupBy(inLot, (t) => t.souslot);
      for (const sl of [...bySous.keys()].sort()) {
        const inSous = bySous.get(sl);
        const indent = lot ? (sl ? "    -" : "  -") : "-";
        if (sl) {
          const g = hatDone(inSous) ? "✓" : "·";
          lines.push(`  - ${g} \`${sl}\` sous-lot`);
        }
        for (const t of inSous) lines.push(taskLine(t, indent));
      }
    }

    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`**${tasks.length} live · ${projectOrder.length} projets**`);
  lines.push("");

  fs.writeFileSync(path.join(RASTER_ROOT, "BACKLOG.md"), lines.join("\n"), "utf8");
}

export function regen() {
  const tasks = loadTasks();
  const n = writeIndex(tasks);
  writeSprint(tasks);
  writeBacklog(tasks);
  return { tasks: n, projects: new Set(tasks.map((t) => t.project)).size };
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  const r = regen();
  console.log(
    `regen ok — ${r.tasks} tasks, ${r.projects} projects → INDEX.tsv SPRINT.md BACKLOG.md`
  );
}
