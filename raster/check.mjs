#!/usr/bin/env node
/**
 * raster check — le canon, au niveau CHECK.
 *
 * Une règle en markdown est une suggestion. Ce fichier la rend opposable.
 * Sort en 1 si une ERREUR est trouvée. Les WARN n'échouent pas.
 *
 *   node raster/check.mjs
 *   node raster/t.mjs check
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectTaskFiles,
  treeFromPath,
} from "./walk-tasks.mjs";
import { parseFrontmatter } from "./regen.mjs";
import { inferWorkType, resolveAgentType } from "./agent-type.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

const TYPES = new Set(["spec", "feature", "bug", "tech", "physical"]);
const STATUSES = new Set(["todo", "doing", "blocked", "done"]);
const EXEC_TYPES = new Set(["feature", "bug", "tech", "physical"]);

const rel = (p) => path.relative(REPO_ROOT, p).replace(/\\/g, "/");

/** Exception unique — la forme, jamais une valeur. */
export const SECRET_ALLOW = "nafura-platform/ops/secrets/README.md";

/**
 * Fichier suivi qui matche un motif secret.
 * Motifs : `*.env` · `*_api_key.txt` · `creds*` · `*.pem` · `*.p12` · `*.jks`
 */
export function isTrackedSecret(relPath) {
  const n = String(relPath || "").replace(/\\/g, "/");
  if (n === SECRET_ALLOW) return false;
  const base = n.split("/").pop() || n;
  return (
    /\.env$/.test(base) ||
    /_api_key\.txt$/.test(base) ||
    /^creds/.test(base) ||
    /\.pem$/.test(base) ||
    /\.p12$/.test(base) ||
    /\.jks$/.test(base)
  );
}

export function checkTrackedSecrets(trackedRelPaths, err) {
  for (const p of trackedRelPaths) {
    const n = String(p || "").replace(/\\/g, "/");
    if (!n) continue;
    if (isTrackedSecret(n)) {
      err(
        n,
        "fichier secret suivi — interdit (*.env · *_api_key.txt · creds* · *.pem · *.p12 · *.jks)"
      );
    }
  }
}

function gitLsFiles() {
  const out = execFileSync("git", ["ls-files", "-z"], {
    cwd: REPO_ROOT,
    encoding: "buffer",
  });
  return out
    .toString("utf8")
    .split("\0")
    .map((p) => p.replace(/\\/g, "/"))
    .filter(Boolean);
}

// ── tickets ──────────────────────────────────────────────────────────────

function checkTickets(err, warn) {
  const files = collectTaskFiles(REPO_ROOT);
  const byId = new Map();
  const tasks = [];

  for (const file of files) {
    const at = rel(file);
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseFrontmatter(raw);

    if (!fm) {
      err(at, "pas de frontmatter");
      continue;
    }
    if (!fm.id) {
      err(at, "`id:` manquant");
      continue;
    }

    // R5 — id unique
    if (byId.has(fm.id)) {
      err(at, `id \`${fm.id}\` déjà utilisé par ${byId.get(fm.id)}`);
    } else {
      byId.set(fm.id, at);
    }

    // R3 — champs supprimés
    for (const dead of ["kind", "parent", "feature", "gate"]) {
      if (fm[dead] !== undefined) {
        err(at, `\`${dead}:\` supprimé du schéma — l'arbre est le chemin`);
      }
    }

    // R2 — enums
    const type = (fm.type || "").toLowerCase();
    if (!type) err(at, "`type:` manquant");
    else if (!TYPES.has(type)) {
      err(at, `type \`${type}\` hors enum (${[...TYPES].join(" | ")})`);
    }
    const status = fm.status || "";
    if (!STATUSES.has(status)) {
      err(at, `status \`${status}\` hors enum`);
    }
    if (TYPES.has(type)) {
      try {
        resolveAgentType(inferWorkType(fm), fm.agent_type);
      } catch (e) {
        err(at, e.message);
      }
    }

    // R1 — forme du chemin
    const tree = treeFromPath(REPO_ROOT, file);
    if (!tree.lot) {
      err(at, "hors arbre : attendu `raster-src/lots/<lot>/[<sous-lot>/]tasks/`");
    }
    if (tree.souslot.includes("/")) {
      err(at, `arbre trop profond (\`${tree.souslot}\`) — max lot / sous-lot`);
    }

    tasks.push({ id: fm.id, at, type, status, tree, file, fm });
  }

  // R6 — blocked_by
  for (const t of tasks) {
    const raw = t.fm.blocked_by || "";
    const ids = String(raw)
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    for (const dep of ids) {
      if (!byId.has(dep)) err(t.at, `blocked_by \`${dep}\` — id inconnu`);
      if (dep === t.id) err(t.at, "blocked_by pointe sur elle-même");
    }
  }

  // R7 — 00-PLAN si ≥ 2 tasks exec dans le sous-lot
  const bySousLot = new Map();
  for (const t of tasks) {
    if (!t.tree.souslot) continue;
    const key = `${t.tree.project}//${t.tree.lot}//${t.tree.souslot}`;
    if (!bySousLot.has(key)) bySousLot.set(key, []);
    bySousLot.get(key).push(t);
  }
  for (const [key, list] of bySousLot) {
    const execCount = list.filter((t) => EXEC_TYPES.has(t.type)).length;
    const dir = path.dirname(path.dirname(list[0].file));
    const plan = path.join(dir, "00-PLAN.md");
    if (execCount >= 2 && !fs.existsSync(plan)) {
      err(rel(dir), `${execCount} tasks exec — \`00-PLAN.md\` obligatoire`);
    }
    // Un sous-lot peut ne garder qu'une task active après `sweep` : son plan
    // reste la frontière de livraison et Git porte les tasks déjà closes.
  }

  return tasks;
}

// ── run ──────────────────────────────────────────────────────────────────

export function check() {
  const errors = [];
  const warnings = [];
  const err = (at, msg) => errors.push({ at, msg });
  const warn = (at, msg) => warnings.push({ at, msg });

  const tasks = checkTickets(err, warn);
  checkTrackedSecrets(gitLsFiles(), err);

  return { errors, warnings, tasks: tasks.length };
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  const { errors, warnings, tasks } = check();
  for (const w of warnings) console.log(`WARN  ${w.at}\n      ${w.msg}`);
  for (const e of errors) console.log(`ERROR ${e.at}\n      ${e.msg}`);
  console.log(
    `\ncheck — ${tasks} tasks · ${errors.length} erreurs · ${warnings.length} warnings`
  );
  process.exit(errors.length ? 1 : 0);
}
