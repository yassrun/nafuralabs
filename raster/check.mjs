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
  listRasterProjects,
} from "./walk-tasks.mjs";
import { parseFrontmatter } from "./regen.mjs";
import { inferWorkType, resolveAgentType } from "./agent-type.mjs";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

const TYPES = new Set(["spec", "feature", "bug", "tech", "physical", "qa"]);
const STATUSES = new Set([
  "todo",
  "doing",
  "blocked",
  "review",
  "done-agent",
  "done-me",
]);
const EXEC_TYPES = new Set(["feature", "bug", "tech", "physical"]);
const CADRE_SECTIONS = [
  "Intention",
  "Périmètre",
  "Acteurs",
  "Voisins",
  "Contraintes",
  "Vocabulaire",
];
const CADRE_MAX_LINES = 120; // « une page »

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

function projectRoot(name) {
  return path.join(REPO_ROOT, name);
}

function dirsIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name);
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
    for (const dead of ["kind", "parent", "feature"]) {
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

    // R4 — les critères vivent dans CH.md
    if (/^##\s+Crit[èe]res? d['’]acceptation/im.test(raw)) {
      err(
        at,
        "section « Critères d'acceptation » — ils vivent dans `CH.md`, la task les référence"
      );
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
    if (execCount < 2 && fs.existsSync(plan)) {
      warn(rel(plan), "une seule task exec — le PLAN n'a rien à ordonner");
    }
  }

  return tasks;
}

// ── Pact ↔ Raster ────────────────────────────────────────────────────────

function checkPact(err, warn, tasks) {
  for (const name of listRasterProjects(REPO_ROOT)) {
    const root = projectRoot(name);
    const pact = path.join(root, "pact");
    if (!fs.existsSync(pact)) continue; // Raster seul — rien à vérifier

    // Squelette : pact/ réservé, pas encore pacté — CADRE exigé seulement une fois commencé
    const cadre = path.join(pact, "CADRE.md");
    if (!fs.existsSync(cadre) && dirsIn(pact).length === 0) continue;

    // P1 — CADRE
    if (!fs.existsSync(cadre)) {
      err(rel(pact), "`CADRE.md` manquant — premier document d'une app");
    } else {
      const raw = fs.readFileSync(cadre, "utf8");
      const lines = raw.split("\n").filter((l) => l.trim()).length;
      // P3 — une page
      if (lines > CADRE_MAX_LINES) {
        err(
          rel(cadre),
          `${lines} lignes > ${CADRE_MAX_LINES} — le CADRE tient en une page`
        );
      }
      // P2 — les 6 sections + not_owns
      for (const s of CADRE_SECTIONS) {
        if (!new RegExp(`^##\\s+${s}`, "im").test(raw)) {
          err(rel(cadre), `section « ${s} » manquante`);
        }
      }
      if (!/not_owns/i.test(raw)) {
        err(rel(cadre), "`not_owns` absent — une frontière sans exclusion n'en est pas une");
      }
    }

    // P4 — SPEC par contexte
    const contexts = dirsIn(pact).filter((d) => !d.startsWith("CH-"));
    for (const ctx of contexts) {
      const spec = path.join(pact, ctx, "SPEC.md");
      if (!fs.existsSync(spec)) err(rel(path.join(pact, ctx)), "`SPEC.md` manquant");
    }

    // P5 — chaque CH porte des critères
    const chDirs = [];
    for (const d of dirsIn(pact)) {
      if (d.startsWith("CH-")) chDirs.push(path.join(pact, d));
    }
    for (const ctx of contexts) {
      for (const d of dirsIn(path.join(pact, ctx))) {
        if (d.startsWith("CH-")) chDirs.push(path.join(pact, ctx, d));
      }
    }
    for (const dir of chDirs) {
      const ch = path.join(dir, "CH.md");
      if (!fs.existsSync(ch)) {
        err(rel(dir), "`CH.md` manquant");
        continue;
      }
      const raw = fs.readFileSync(ch, "utf8");
      if (!/\bAC-\d+\b/.test(raw)) {
        err(rel(ch), "aucun critère `AC-n` — rien à prouver, donc rien à clore");
      }
    }

    // X1 — sous-lot Raster ↔ CH Pact, nom identique, dans les deux sens
    const pactCH = new Set(chDirs.map((d) => rel(d).split("/").slice(-2).join("/")));
    const rasterCH = new Set();
    for (const t of tasks) {
      if (t.tree.project !== name || !t.tree.souslot.startsWith("CH-")) continue;
      const ctx = t.tree.lot === "cadre" ? "pact" : t.tree.lot;
      rasterCH.add(`${ctx}/${t.tree.souslot}`);
    }
    for (const k of rasterCH) {
      if (!pactCH.has(k)) {
        err(`${name}/raster-src`, `sous-lot \`${k}\` sans CH côté pact/`);
      }
    }
    for (const k of pactCH) {
      if (!rasterCH.has(k)) {
        warn(`${name}/pact`, `CH \`${k}\` sans sous-lot Raster — aucun travail rattaché`);
      }
    }

    // X2 — une POL référencée est définie dans le socle
    const socleSpec = path.join(pact, "socle", "SPEC.md");
    if (fs.existsSync(socleSpec)) {
      const socle = fs.readFileSync(socleSpec, "utf8");
      const defined = new Set(socle.match(/\bPOL-[A-Z0-9-]+\b/g) || []);
      for (const ctx of contexts) {
        if (ctx === "socle") continue;
        const spec = path.join(pact, ctx, "SPEC.md");
        if (!fs.existsSync(spec)) continue;
        const used = new Set(
          fs.readFileSync(spec, "utf8").match(/\bPOL-[A-Z0-9-]+\b/g) || []
        );
        for (const p of used) {
          if (!defined.has(p)) {
            err(rel(spec), `\`${p}\` référencée mais non définie dans le socle`);
          }
        }
      }
    }
  }
}

// ── run ──────────────────────────────────────────────────────────────────

export function check() {
  const errors = [];
  const warnings = [];
  const err = (at, msg) => errors.push({ at, msg });
  const warn = (at, msg) => warnings.push({ at, msg });

  const tasks = checkTickets(err, warn);
  checkPact(err, warn, tasks);
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
