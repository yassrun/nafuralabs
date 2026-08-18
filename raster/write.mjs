/**
 * raster write — le SEUL chemin d'écriture d'une task.
 *
 * Un agent ne compose jamais de frontmatter à la main : il appelle une commande,
 * qui alloue l'id, pose les enums, crée le dossier et régénère les vues.
 * Contrat : `raster/AGENTS.md` §0.1-9.
 *
 * Règle de refus : on valide TOUT avant d'écrire quoi que ce soit. Une commande
 * qui refuse ne laisse rien derrière elle — ni fichier, ni dossier, ni ligne
 * d'inbox consommée.
 *
 *   node raster/t.mjs new raster work/CH-02-… "Titre" --type tech
 *   node raster/t.mjs promote "ligne" raster work/CH-02-…
 *   node raster/t.mjs status RAS-79 doing
 *   node raster/t.mjs approve RAS-78
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectTaskFiles, treeFromPath } from "./walk-tasks.mjs";
import { parseFrontmatter } from "./regen.mjs";
import { expectedAgentType } from "./agent-type.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");
const INBOX = path.join(RASTER_ROOT, "inbox.md");

export const TYPES = ["spec", "feature", "bug", "tech", "physical", "qa"];
export const PRIORITIES = ["P0", "P1", "P2", "P3"];
export const ASSIGNEES = ["me", "agent", "either"];
export const GATES = ["none", "me"];
export const CONTEXTS = ["nafura", "saham", "personal"];

/** Statuts qu'une commande `status` accepte. `done-me` n'en est pas : il se gagne. */
export const SETTABLE_STATUS = [
  "todo",
  "doing",
  "blocked",
  "review",
  "done-agent",
];

const PROJECT_PREFIX = {
  "sektor-btp": "ERP",
  sektor: "SEKTOR",
  raster: "RAS",
  personal: "PER",
  ops: "OPS",
  "mbs-website": "MBS",
  "nafuralabs-migration": "MIG",
  "nafura-platform": "PLT",
};

export class RefusError extends Error {}

const refuse = (msg) => {
  throw new RefusError(msg);
};

const rel = (p) => path.relative(REPO_ROOT, p).replace(/\\/g, "/");

export function projectPrefix(project) {
  return PROJECT_PREFIX[project] || project.slice(0, 3).toUpperCase();
}

function rasterSrc(project) {
  return path.join(REPO_ROOT, project, "raster-src");
}

/**
 * Borne haute des ids. Le backlog live ne suffit pas : `done-me` sort du dépôt
 * (`t.mjs sweep`), donc `<projet>/raster-src/NEXT` garde le maximum atteint.
 */
export function nextId(project) {
  const prefix = projectPrefix(project);
  let max = 0;
  const idRe = new RegExp(`^${prefix}-(\\d+)$`);
  const fileRe = new RegExp(`^${prefix}-(\\d+)-`);
  for (const file of collectTaskFiles(REPO_ROOT, { includeArchive: true })) {
    const m = path.basename(file).match(fileRe);
    if (m) max = Math.max(max, Number(m[1]));
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    const im = fm?.id?.match(idRe);
    if (im) max = Math.max(max, Number(im[1]));
  }
  const counter = path.join(rasterSrc(project), "NEXT");
  if (fs.existsSync(counter)) {
    const n = Number(fs.readFileSync(counter, "utf8").trim());
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return { id: `${prefix}-${max + 1}`, n: max + 1 };
}

function bumpNext(project, n) {
  const dir = rasterSrc(project);
  if (!fs.existsSync(dir)) return;
  const file = path.join(dir, "NEXT");
  const cur = fs.existsSync(file)
    ? Number(fs.readFileSync(file, "utf8").trim())
    : 0;
  if (n > cur) fs.writeFileSync(file, `${n}\n`, "utf8");
}

export function slugify(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "task";
}

/** Enums fermés — on ne les invente jamais (§2). */
function checkEnums({ type, priority, assignee, gate, context, agent_type }) {
  if (!TYPES.includes(type)) {
    refuse(`type "${type}" inconnu — attendu : ${TYPES.join(" | ")}`);
  }
  if (!PRIORITIES.includes(priority)) {
    refuse(`priority "${priority}" inconnue — attendu : ${PRIORITIES.join(" | ")}`);
  }
  if (!ASSIGNEES.includes(assignee)) {
    refuse(`assignee "${assignee}" inconnu — attendu : ${ASSIGNEES.join(" | ")}`);
  }
  if (!GATES.includes(gate)) {
    refuse(`gate "${gate}" inconnue — attendu : ${GATES.join(" | ")}`);
  }
  if (!CONTEXTS.includes(context)) {
    refuse(`context "${context}" inconnu — attendu : ${CONTEXTS.join(" | ")}`);
  }
  const expected = expectedAgentType(type);
  if (agent_type && agent_type !== expected) {
    refuse(
      `agent_type "${agent_type}" incompatible avec type "${type}" — attendu ${expected}`
    );
  }
  return expected;
}

/**
 * Cible = un DOSSIER : "<lot>" ou "<lot>/<sous-lot>".
 * Le lot doit exister — sauf `nouveauLot`, sinon une faute de frappe crée un lot.
 */
function resolveTarget(project, target, { nouveauLot = false } = {}) {
  const lots = path.join(rasterSrc(project), "lots");
  if (!fs.existsSync(lots)) {
    refuse(`"${project}" n'est pas un projet Raster — ${rel(lots)} absent`);
  }
  const segs = String(target || "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!segs.length) refuse("cible vide — attendu <lot> ou <lot>/<sous-lot>");
  const lotDir = path.join(lots, segs[0]);
  if (!fs.existsSync(lotDir) && !nouveauLot) {
    refuse(`lot "${segs[0]}" inexistant dans ${project} — --nouveau-lot pour le créer`);
  }
  const dir = path.join(lots, ...segs);
  return { dir, tasksDir: path.join(dir, "tasks"), lot: segs[0] };
}

function renderTask(fm, body) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(fm)) {
    if (v === "" || v === null || v === undefined) continue;
    lines.push(`${k}: ${Array.isArray(v) ? `[${v.join(", ")}]` : v}`);
  }
  lines.push("---", "", "");
  return lines.join("\n") + body;
}

function defaultBody(title, note) {
  return [
    `# ${title}`,
    "",
    `> ${note || "2 lignes max."}`,
    "",
    "## Étapes",
    "",
    "- [ ] …",
    "",
    "## Journal",
    "",
    "```",
    `${stamp()}  posée`,
    "```",
    "",
    "## Rapport de livraison",
    "",
  ].join("\n");
}

function stamp(d = new Date()) {
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Crée une task. Valide d'abord, écrit ensuite — jamais l'inverse.
 * Retourne { id, file }.
 */
export function createTask({
  project,
  target,
  title,
  type = "feature",
  priority = "P2",
  assignee = "agent",
  gate = "none",
  context = "nafura",
  agent_type = "",
  blocked_by = [],
  tags = [],
  note = "",
  nouveauLot = false,
}) {
  if (!project) refuse("projet manquant");
  if (!String(title || "").trim()) refuse("titre vide");
  const resolvedAgent = checkEnums({
    type,
    priority,
    assignee,
    gate,
    context,
    agent_type,
  });
  const { tasksDir } = resolveTarget(project, target, { nouveauLot });

  const known = new Set(
    collectTaskFiles(REPO_ROOT, { includeArchive: true })
      .map((f) => parseFrontmatter(fs.readFileSync(f, "utf8"))?.id)
      .filter(Boolean)
  );
  for (const dep of blocked_by) {
    if (!known.has(dep)) refuse(`blocked_by "${dep}" — id inconnu`);
  }

  const { id, n } = nextId(project);
  const file = path.join(tasksDir, `${id}-${slugify(title)}.md`);
  if (fs.existsSync(file)) refuse(`${rel(file)} existe déjà`);

  // NEXT d'abord : sur-allouer un id est sans conséquence, en réattribuer un
  // ne l'est pas. Si l'écriture qui suit échoue, la borne reste en avance.
  bumpNext(project, n);
  fs.mkdirSync(tasksDir, { recursive: true });
  fs.writeFileSync(
    file,
    renderTask(
      {
        id,
        status: "todo",
        context,
        type,
        agent_type: resolvedAgent,
        priority,
        assignee,
        gate,
        blocked_by: blocked_by.length ? blocked_by : "",
        tags: tags.length ? tags : "",
      },
      defaultBody(title.trim(), note)
    ),
    "utf8"
  );
  return { id, file: rel(file) };
}

export function readInbox() {
  if (!fs.existsSync(INBOX)) return [];
  return fs
    .readFileSync(INBOX, "utf8")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
    .filter((l) => l && !l.startsWith("#"));
}

function dropInboxLine(line) {
  if (!fs.existsSync(INBOX)) return;
  const kept = fs
    .readFileSync(INBOX, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.replace(/^\s*[-*]\s+/, "").trim() !== line.trim());
  fs.writeFileSync(INBOX, kept.join("\n"), "utf8");
}

/** `@tag` dans la ligne → type quand il en nomme un, tag sinon. */
function readTags(line) {
  const tags = [];
  let type = "";
  const title = line
    .replace(/(?:^|\s)@([a-zA-Z0-9_-]+)/g, (_, t) => {
      if (!type && TYPES.includes(t.toLowerCase())) type = t.toLowerCase();
      else tags.push(t);
      return " ";
    })
    .replace(/\s+/g, " ")
    .trim();
  return { title: title || line.trim(), type: type || "feature", tags };
}

/** Une ligne d'inbox devient une task. La ligne ne part que si la task est écrite. */
export function promoteLine(line, project, target, opts = {}) {
  const lines = readInbox();
  const found = lines.find((l) => l === line.trim());
  if (!found) refuse(`ligne absente de raster/inbox.md : "${line}"`);
  const { title, type, tags } = readTags(found);
  const res = createTask({
    project,
    target,
    title,
    type,
    tags,
    ...opts,
  });
  dropInboxLine(found);
  return res;
}

export function findTask(id) {
  for (const file of collectTaskFiles(REPO_ROOT)) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (fm?.id === id) return { file, fm };
  }
  refuse(`task "${id}" introuvable`);
}

/** Patch du frontmatter en place. Le corps n'est jamais touché. */
function patchFrontmatter(file, changes) {
  const raw = fs.readFileSync(file, "utf8");
  const end = raw.indexOf("\n---", 4);
  const block = raw.slice(4, end).replace(/\r/g, "");
  const rest = raw.slice(end + 4);
  const out = [];
  const seen = new Set();
  for (const l of block.split("\n")) {
    const m = l.match(/^([a-z_]+):\s*(.*)$/);
    if (!m || !(m[1] in changes)) {
      out.push(l);
      continue;
    }
    seen.add(m[1]);
    if (changes[m[1]] !== null) out.push(`${m[1]}: ${changes[m[1]]}`);
  }
  for (const [k, v] of Object.entries(changes)) {
    if (!seen.has(k) && v !== null) out.push(`${k}: ${v}`);
  }
  fs.writeFileSync(file, `---\n${out.join("\n")}\n---${rest}`, "utf8");
}

/** Ajoute une ligne au journal, sans jamais réécrire les précédentes. */
function appendJournal(file, msg) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/(## Journal\s*\n+```\n)([\s\S]*?)(```)/);
  if (!m) return;
  const entry = `${stamp()}  ${msg}\n`;
  fs.writeFileSync(
    file,
    raw.slice(0, m.index) + m[1] + m[2] + entry + m[3] + raw.slice(m.index + m[0].length),
    "utf8"
  );
}

/**
 * `done-me` ne se pose pas — il résulte d'une approbation (§0.1-8).
 * Sur `gate: none`, `done-agent` bascule seul : personne ne t'attend.
 */
export function setStatus(id, status) {
  if (status === "done-me") {
    refuse("`done-me` ne se pose pas — il résulte de `approve` (AGENTS.md §0.1-8)");
  }
  if (!SETTABLE_STATUS.includes(status)) {
    refuse(`status "${status}" inconnu — attendu : ${SETTABLE_STATUS.join(" | ")}`);
  }
  const { file, fm } = findTask(id);
  let final = status;
  if (status === "done-agent" && (fm.gate || "none") === "none") final = "done-me";
  patchFrontmatter(file, { status: final });
  appendJournal(
    file,
    final === status
      ? `status → ${final}`
      : `status → done-agent · gate none → done-me`
  );
  return { id, status: final, file: rel(file) };
}

/** Le seul chemin vers `done-me` : ton approbation d'un `done-agent` sous `gate: me`. */
export function approve(id) {
  const { file, fm } = findTask(id);
  if (fm.status !== "done-agent") {
    refuse(`${id} est "${fm.status}" — on n'approuve qu'un done-agent`);
  }
  if ((fm.gate || "none") !== "me") {
    refuse(`${id} n'a pas gate: me — rien à approuver`);
  }
  patchFrontmatter(file, { status: "done-me" });
  appendJournal(file, "toi · approuvée → done-me");
  return { id, status: "done-me", file: rel(file) };
}

export function taskProject(file) {
  return treeFromPath(REPO_ROOT, file).project;
}
