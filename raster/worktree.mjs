/**
 * raster worktree — l'isolation physique d'un sous-lot.
 *
 * Une branche n'isole rien : deux agents lancés en parallèle dans le même
 * répertoire de travail s'écrasent quelle que soit la branche, puisqu'il n'y a
 * qu'un checkout. C'est le worktree qui donne à chacun son répertoire.
 *
 * LES WORKTREES VIVENT HORS DU DÉPÔT. Un worktree posé dedans serait scanné par
 * le walker (`**\/raster-src/lots/**`) et chaque task apparaîtrait une fois par
 * branche vivante. Voir `AGENTS.md` §7.
 *
 *   node raster/t.mjs worktree list
 *   node raster/t.mjs worktree add raster socle panneau-decision
 *   node raster/t.mjs worktree rm  raster socle panneau-decision
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(RASTER_ROOT, "..");

export class WorktreeError extends Error {}

const fail = (m) => {
  throw new WorktreeError(m);
};

/** Frère du dépôt, jamais dedans. Surchargeable pour les tests. */
export function worktreeRoot() {
  return (
    process.env.RASTER_WORKTREES ||
    path.resolve(REPO_ROOT, "..", ".raster-worktrees")
  );
}

/** Vrai si `p` est à l'intérieur de l'arbre du dépôt. */
export function insideRepo(p) {
  const rel = path.relative(REPO_ROOT, path.resolve(p));
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export function branchName(lot, souslot) {
  return souslot ? `${lot}/${souslot}` : `lot/${lot}`;
}

export function worktreePath(project, lot, souslot) {
  return path.join(worktreeRoot(), project, souslot || lot);
}

/**
 * `-c core.longpaths=true` sur NOS invocations seulement.
 *
 * Windows coupe à 260 caractères. Un worktree ajoute son préfixe à des chemins
 * Java déjà profonds, et `git worktree add` échoue en « Filename too long » à
 * mi-checkout, laissant un worktree cassé. Le flag est passé par commande :
 * on ne touche ni à la config du dépôt, ni aux réglages du système.
 */
function git(args, cwd = REPO_ROOT) {
  return execFileSync("git", ["-c", "core.longpaths=true", ...args], {
    cwd,
    encoding: "utf8",
  }).trim();
}

/** `git worktree list --porcelain` → [{ path, branch }]. */
export function listWorktrees() {
  let raw = "";
  try {
    raw = git(["worktree", "list", "--porcelain"]);
  } catch {
    return [];
  }
  const out = [];
  let cur = null;
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      if (cur) out.push(cur);
      cur = { path: line.slice(9).trim(), branch: "" };
    } else if (line.startsWith("branch ") && cur) {
      cur.branch = line.slice(7).trim().replace(/^refs\/heads\//, "");
    }
  }
  if (cur) out.push(cur);
  // Le premier est le dépôt lui-même, pas un worktree d'agent.
  return out.filter((w) => path.resolve(w.path) !== REPO_ROOT);
}

/**
 * Crée le worktree d'un sous-lot. Idempotent : s'il existe déjà, on le rend.
 * Refuse tout emplacement à l'intérieur du dépôt.
 */
export function addWorktree(project, lot, souslot, { base = "HEAD" } = {}) {
  if (!project || !lot) fail("projet et lot requis");
  const dir = worktreePath(project, lot, souslot);
  if (insideRepo(dir)) {
    fail(
      `worktree refusé : ${dir} est dans le dépôt — le walker compterait chaque task deux fois`
    );
  }
  const branch = branchName(lot, souslot);
  const existing = listWorktrees().find(
    (w) => path.resolve(w.path) === path.resolve(dir)
  );
  if (existing) return { ...existing, cree: false, branch: existing.branch || branch };

  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const known = git(["branch", "--list", branch]);
  try {
    git(
      known
        ? ["worktree", "add", dir, branch]
        : ["worktree", "add", "-b", branch, dir, base]
    );
  } catch (e) {
    fail(`git worktree add a échoué : ${String(e.stderr || e.message).trim()}`);
  }
  return { path: dir, branch, cree: true };
}

/** Retire le worktree. La branche reste : elle porte le travail. */
export function removeWorktree(project, lot, souslot, { force = false } = {}) {
  const dir = worktreePath(project, lot, souslot);
  const known = listWorktrees().find(
    (w) => path.resolve(w.path) === path.resolve(dir)
  );
  if (!known) return { path: dir, retire: false };
  try {
    git(["worktree", "remove", ...(force ? ["--force"] : []), dir]);
  } catch (e) {
    fail(`git worktree remove a échoué : ${String(e.stderr || e.message).trim()}`);
  }
  return { path: dir, retire: true };
}

export function formatWorktrees(list) {
  if (!list.length) return "aucun worktree";
  return list
    .map((w) => `${(w.branch || "(détaché)").padEnd(46)} ${w.path}`)
    .join("\n");
}
