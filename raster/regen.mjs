#!/usr/bin/env node
/**
 * Regen Raster orchestrator views from product lot tasks.
 * Walks every NafuraLabs project (IT or not):
 *   - <projet>/raster-src/lots/.../tasks/*.md   (seul scan — peers + products si raster-src)
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
import { collectTaskFiles, projectFromPath } from "./walk-tasks.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

const STATUS_ORDER = { doing: 0, review: 1, blocked: 2, todo: 3, "done-agent": 4, "done-me": 5, done: 6 };
const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };
const GLYPH = { todo: "·", doing: "▸", blocked: "✕", review: "◐", "done-agent": "✓", "done-me": "✓", done: "✓" };

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
    const project = projectFromPath(REPO_ROOT, file);
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

function isHat(t) {
  return (
    t.kind === "lot" ||
    t.kind === "sous-lot" ||
    t.kind === "feature" ||
    t.kind === "bug-umbrella"
  );
}

function isWorkTask(t) {
  if (isHat(t) || t.kind === "spec") return false;
  return true;
}

function hatHasWork(hat, all) {
  const kids = all.filter((t) => t.parent === hat.id);
  if (kids.some(isWorkTask)) return true;
  if (hat.kind === "lot") {
    return kids
      .filter((k) => k.kind === "sous-lot" || k.kind === "feature")
      .some((sl) => hatHasWork(sl, all));
  }
  return false;
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
  const live = tasks.filter(isWorkTask);
  const sorted = [...live].sort(sortTasks);
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
  const committed = tasks
    .filter(
      (t) =>
        t.sprint === id &&
        isWorkTask(t) &&
        t.status !== "done-agent" &&
        t.status !== "done-me" &&
        t.status !== "done"
    )
    .sort(sortTasks);
  const readyP1 = tasks
    .filter(
      (t) =>
        isWorkTask(t) &&
        !t.sprint &&
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

function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function backlogKind(t) {
  if (t.kind === "lot") return "lot";
  if (t.kind === "sous-lot" || t.kind === "feature") return "sous-lot";
  if (t.kind === "spec") return "spec";
  return "task";
}

function backlogLine(t, indent) {
  const g = GLYPH[t.status] || "·";
  return `${indent} ${g} \`${padId(t.id).trim()}\` ${backlogKind(t)} — ${t.title}`;
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
    "> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`. Legacy = `raster/lots` · `docs/specs/lots`.",
    "> Arbre = `parent:` (lot → sous-lot → task). Sprint = champ `sprint:` sur la **task** seulement.",
    "> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.",
    "> Inbox : `raster/inbox.md`.",
    "",
  ];

  for (const proj of projectOrder) {
    const list = byProject.get(proj);
    const printed = new Set();
    const lots = list
      .filter((t) => t.kind === "lot" && hatHasWork(t, list))
      .sort(byId);
    const lotIds = new Set(list.filter((t) => t.kind === "lot").map((t) => t.id));
    const sousLotIds = new Set(
      list
        .filter((t) => t.kind === "sous-lot" || t.kind === "feature")
        .map((t) => t.id)
    );

    lines.push(`## ${proj}`);
    lines.push("");

    const emit = (t, indent) => {
      if (t.kind === "spec") return;
      if (isHat(t) && !hatHasWork(t, list)) return;
      printed.add(t.id);
      lines.push(backlogLine(t, indent));
    };

    for (const lot of lots) {
      emit(lot, "-");
      const sls = list
        .filter(
          (t) =>
            (t.kind === "sous-lot" || t.kind === "feature") &&
            t.parent === lot.id &&
            hatHasWork(t, list)
        )
        .sort(byId);
      for (const sl of sls) {
        emit(sl, "  -");
        list
          .filter((t) => t.parent === sl.id && isWorkTask(t))
          .sort(byId)
          .forEach((k) => emit(k, "    -"));
      }
      list
        .filter((t) => t.parent === lot.id && isWorkTask(t))
        .sort(byId)
        .forEach((k) => emit(k, "    -"));
    }

    const orphanSous = list
      .filter(
        (t) =>
          (t.kind === "sous-lot" || t.kind === "feature") &&
          hatHasWork(t, list) &&
          (!t.parent || !lotIds.has(t.parent))
      )
      .sort(byId);
    for (const sl of orphanSous) {
      emit(sl, "-");
      list
        .filter((t) => t.parent === sl.id && isWorkTask(t))
        .sort(byId)
        .forEach((k) => emit(k, "  -"));
    }

    const orphans = list
      .filter(
        (t) =>
          isWorkTask(t) &&
          !printed.has(t.id) &&
          (!t.parent ||
            (!lotIds.has(t.parent) && !sousLotIds.has(t.parent)))
      )
      .sort(byId);
    for (const t of orphans) emit(t, "-");

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
