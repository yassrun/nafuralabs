/**
 * Front exécutable d'un sous-lot.
 *
 * Pipeline MVP : Spec → Code → Done. Raster calcule la vague mais le harness
 * Cursor exécute la sous-session. En local, une seule Task Code est confiée à
 * la fois. En mode agents, les Tasks Code indépendantes peuvent partir ensemble.
 */
import { normalizeMode } from "./execution-mode.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectTaskFiles, treeFromPath } from "./walk-tasks.mjs";
import { parseFrontmatter } from "./regen.mjs";
import { inferWorkType, parseListField, resolveAgentType } from "./agent-type.mjs";

const CLOSED = new Set(["done"]);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadSubLotTasks(project, lot, souslot = "") {
  const tasks = [];
  for (const file of collectTaskFiles(REPO_ROOT)) {
    const tree = treeFromPath(REPO_ROOT, file);
    if (
      tree.project !== project ||
      tree.lot !== lot ||
      tree.souslot !== souslot
    ) {
      continue;
    }
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm?.id) continue;
    const type = inferWorkType(fm);
    tasks.push({
      id: fm.id,
      status: fm.status || "todo",
      type,
      agent_type: resolveAgentType(type, fm.agent_type),
      blocked_by: parseListField(fm.blocked_by),
      title: fm._title,
      file: path.relative(REPO_ROOT, file).replace(/\\/g, "/"),
    });
  }
  return tasks;
}

function dependenciesClosed(task, byId) {
  return (task.blocked_by || []).every((id) => {
    const dependency = byId.get(id);
    // Les dépendances externes ont déjà été validées par Ready.
    return !dependency || CLOSED.has(dependency.status);
  });
}

export function computeSessionFront(tasks, mode = "local") {
  const selectedMode = normalizeMode(mode);
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const open = tasks.filter((task) => !CLOSED.has(task.status));
  const specs = open.filter((task) => task.agent_type === "spec");

  if (specs.length) {
    const ready = specs.filter((task) => dependenciesClosed(task, byId));
    return {
      phase: "spec",
      parallel: false,
      tasks: ready.slice(0, 1),
    };
  }

  const code = open.filter(
    (task) =>
      task.agent_type === "exec" &&
      task.status !== "blocked" &&
      dependenciesClosed(task, byId)
  );
  const wave = selectedMode === "agents" ? code : code.slice(0, 1);
  return {
    phase: wave.length ? "code" : open.length ? "blocked" : "done",
    parallel: selectedMode === "agents" && wave.length > 1,
    tasks: wave,
  };
}

export function harnessBrief({ project, lot, souslot, tasks, mode }) {
  const selectedMode = normalizeMode(mode);
  const front = computeSessionFront(tasks, selectedMode);
  const where = [lot, souslot].filter(Boolean).join("/");
  const lines = front.tasks.length
    ? front.tasks.map(
        (task) =>
          `- ${task.id} · ${task.file || ""} · ${task.title || task.type || "Task"}`
      )
    : ["- aucune Task exécutable"];
  const controlCli = path
    .join(REPO_ROOT, "raster", "t.mjs")
    .replace(/\\/g, "/");

  return [
    "# Raster — sous-session Cursor",
    `projet: ${project}`,
    `sous-lot: ${where}`,
    `mode: ${selectedMode}`,
    `phase: ${front.phase}`,
    `parallèle: ${front.parallel ? "oui" : "non"}`,
    "",
    "Pipeline: Spec → Code → Done.",
    "Aucune QA dédiée, aucune gate humaine pendant la sous-session.",
    selectedMode === "local"
      ? `Chaque worker termine sa Task avec: node "${controlCli}" status <id> done`
      : `À la fin, écrire exactement: RASTER_RESULT ${JSON.stringify({
          done: front.tasks.map((task) => task.id),
          blocked: [],
        })}`,
    front.parallel
      ? "Les Tasks ci-dessous sont indépendantes et peuvent être confiées à plusieurs agents Cursor en parallèle."
      : "Exécuter uniquement la Task ci-dessous.",
    "",
    "Front exécutable:",
    ...lines,
  ].join("\n");
}
