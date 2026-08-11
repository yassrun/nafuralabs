#!/usr/bin/env node
/**
 * Regen Raster orchestrator views from product epic tasks.
 * Walks: products/<app>/docs/specs/epics/<slug>/tasks/*.md
 * Skips: epics/_archive (done)
 * Writes: INDEX.tsv, SPRINT.md, BACKLOG.md under raster/
 *
 *   node raster/regen.mjs
 *   node raster/t.mjs index
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");
const PRODUCTS_ROOT = path.join(REPO_ROOT, "products");

const STATUS_ORDER = { doing: 0, review: 1, blocked: 2, todo: 3, done: 4 };
const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };
const GLYPH = { todo: "·", doing: "▸", blocked: "✕", review: "◐", done: "✓" };

function walkEpicTasks(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "_archive" || ent.name === "node_modules") continue;
      if (ent.name === "tasks") {
        for (const f of fs.readdirSync(full)) {
          if (f.endsWith(".md")) out.push(path.join(full, f));
        }
      } else {
        walkEpicTasks(full, out);
      }
    }
  }
  return out;
}

function collectTaskFiles() {
  const files = [];
  if (!fs.existsSync(PRODUCTS_ROOT)) return files;
  for (const app of fs.readdirSync(PRODUCTS_ROOT, { withFileTypes: true })) {
    if (!app.isDirectory()) continue;
    const epics = path.join(
      PRODUCTS_ROOT,
      app.name,
      "docs",
      "specs",
      "epics"
    );
    walkEpicTasks(epics, files);
  }
  return files;
}

function parseFrontmatter(raw) {
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

function projectFromPath(filePath) {
  const rel = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
  const m = rel.match(/^products\/([^/]+)\//);
  if (m) return m[1];
  return "misc";
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
  const files = collectTaskFiles();
  const tasks = [];
  for (const file of files) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm?.id) continue;
    if (fm.status === "done") continue; // safety if done left in live tree
    const project = projectFromPath(file);
    tasks.push({
      id: fm.id,
      status: fm.status || "todo",
      priority: fm.priority || "P3",
      context: fm.context || "nafura",
      assignee: fm.assignee || "",
      gate: fm.gate || "",
      kind: fm.kind || "task",
      sprint: fm.sprint || "",
      parent: fm.parent || "",
      feature: fm.feature || "",
      blocked_by: fm.blocked_by || "",
      title: shortTitle(fm._title),
      titleFull: fm._title,
      project,
      file,
    });
  }
  return tasks;
}

function sortTasks(a, b) {
  const sa = STATUS_ORDER[a.status] ?? 9;
  const sb = STATUS_ORDER[b.status] ?? 9;
  if (sa !== sb) return sa - sb;
  const pa = PRIORITY_ORDER[a.priority] ?? 9;
  const pb = PRIORITY_ORDER[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  const fa = a.feature || a.id;
  const fb = b.feature || b.id;
  if (fa !== fb) return fa < fb ? -1 : 1;
  const ua = a.kind === "feature" && !a.parent ? 0 : 1;
  const ub = b.kind === "feature" && !b.parent ? 0 : 1;
  if (ua !== ub) return ua - ub;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function isoWeekInfo(d = new Date()) {
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
    "id\tstatus\tpriority\tcontext\tassignee\tgate\tkind\tsprint\tparent\tfeature\ttitle";
  const rows = sorted.map((t) =>
    [
      t.id,
      t.status,
      t.priority,
      t.context,
      t.assignee,
      t.gate,
      t.kind,
      t.sprint,
      t.parent,
      t.feature,
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
  const committed = tasks.filter((t) => t.sprint === id).sort(sortTasks);
  const readyP1 = tasks
    .filter(
      (t) =>
        !t.sprint &&
        t.kind !== "feature" &&
        t.priority === "P1" &&
        t.status === "todo"
    )
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
        lines.push(
          `  ${GLYPH[t.status] || "·"} ${padId(t.id)}  ${t.title.padEnd(32).slice(0, 32)}  ${who.padEnd(8)}  ${gate}`
        );
      }
      lines.push("");
    }
  } else {
    for (const t of committed) {
      const who = t.assignee ? `[${t.assignee}]` : "";
      const gate = t.gate ? `gate:${t.gate}` : "";
      lines.push(
        `${GLYPH[t.status] || "·"} ${padId(t.id)}  ${t.title.padEnd(32).slice(0, 32)}  ${t.priority}  ${who.padEnd(8)}  ${gate}`
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

function sortBacklogCluster(a, b) {
  const ua = a.kind === "feature" && !a.parent ? 0 : 1;
  const ub = b.kind === "feature" && !b.parent ? 0 : 1;
  if (ua !== ub) return ua - ub;
  const sa = STATUS_ORDER[a.status] ?? 9;
  const sb = STATUS_ORDER[b.status] ?? 9;
  if (sa !== sb) return sa - sb;
  const pa = PRIORITY_ORDER[a.priority] ?? 9;
  const pb = PRIORITY_ORDER[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function clusterKey(t) {
  return t.feature || `_${t.id}`;
}

function clusterPriority(list) {
  const umbrella = list.find((t) => t.kind === "feature" && !t.parent);
  if (umbrella) return PRIORITY_ORDER[umbrella.priority] ?? 9;
  return Math.min(...list.map((t) => PRIORITY_ORDER[t.priority] ?? 9));
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
    "> Orchestrateur Raster. Source = `products/<app>/docs/specs/epics/**/tasks/*.md`.",
    "> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.",
    "> Inbox : `products/<app>/docs/specs/inbox.md`.",
    "",
  ];

  for (const proj of projectOrder) {
    const list = byProject.get(proj);
    const clusters = new Map();
    for (const t of list) {
      const k = clusterKey(t);
      if (!clusters.has(k)) clusters.set(k, []);
      clusters.get(k).push(t);
    }
    const clusterOrder = [...clusters.keys()].sort((a, b) => {
      const pa = clusterPriority(clusters.get(a));
      const pb = clusterPriority(clusters.get(b));
      if (pa !== pb) return pa - pb;
      return a < b ? -1 : 1;
    });

    lines.push(`## ${proj}`);
    lines.push("");
    for (const ck of clusterOrder) {
      const members = clusters.get(ck).sort(sortBacklogCluster);
      for (const t of members) {
        const g = GLYPH[t.status] || "·";
        const kindOrStatus = t.kind === "feature" ? "feature" : t.status;
        const bullet = t.parent ? "  -" : "-";
        lines.push(
          `${bullet} ${g} \`${padId(t.id).trim()}\` ${kindOrStatus} — ${t.title}`
        );
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
