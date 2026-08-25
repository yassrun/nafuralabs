/**
 * raster spawn — lancer un orchestrateur de lot.
 *
 * Le seul endroit où Raster exécute quelque chose. Le CADRE le cadre :
 * « le dépôt suffit à lire, pas à exécuter ». La commande d'agent et sa clé
 * vivent HORS du dépôt, dans l'environnement local. Raster ne les lit pas,
 * ne les écrit pas, et **refuse de démarrer** plutôt que d'en deviner une.
 *
 *   RASTER_AGENT_CMD="claude --print"   node raster/t.mjs run raster socle
 *   node raster/t.mjs running
 *   node raster/t.mjs stop raster socle
 *
 * L'état est EN MÉMOIRE. Un processus mort ne doit jamais laisser un `doing`
 * menteur dans un fichier de task.
 *
 * Conséquence assumée : l'état appartient au processus qui a lancé. Le serveur
 * de l'app vit longtemps, donc `running` / `stop` y ont un sens. En ligne de
 * commande, chaque invocation est un processus neuf : `run` **attend** son
 * agent au lieu de l'orphelinner, et `running` n'y montrera jamais rien.
 */
import { spawn } from "node:child_process";
import { addWorktree, REPO_ROOT, worktreePath } from "./worktree.mjs";

export class SpawnError extends Error {}

const fail = (m) => {
  throw new SpawnError(m);
};

/** lot tenu → état. Un lot n'est jamais tenu deux fois (AGENTS.md §7). */
const running = new Map();

const key = (project, lot) => `${project}//${lot}`;

/** Taille du tampon de sortie gardé par lot — de quoi comprendre, pas de quoi archiver. */
const MAX_LIGNES = 400;

/**
 * La commande vient de l'environnement, jamais du dépôt.
 * Rien de configuré ⇒ on refuse en le disant.
 */
export function agentCommand() {
  const raw = (process.env.RASTER_AGENT_CMD || "").trim();
  if (!raw) return null;
  const parts = raw.match(/"[^"]+"|\S+/g) || [];
  return { cmd: parts[0].replace(/^"|"$/g, ""), args: parts.slice(1).map((a) => a.replace(/^"|"$/g, "")) };
}

export function isRunning(project, lot) {
  return running.has(key(project, lot));
}

export function list() {
  return [...running.values()].map((r) => ({
    project: r.project,
    lot: r.lot,
    branch: r.branch,
    cwd: r.cwd,
    pid: r.pid,
    depuis: r.depuis,
    etat: r.etat,
    code: r.code,
    sortie: r.sortie.slice(-40),
  }));
}

/**
 * Lance un orchestrateur sur un lot. Un worktree par sous-lot est créé si un
 * sous-lot est donné ; sinon on travaille sur une branche de lot.
 *
 * Ne fait AUCUN git push, AUCUN merge : le brief passé à l'agent le dit,
 * et Raster ne l'exécute pas à sa place.
 */
export function start({ project, lot, souslot = "", brief = "" }) {
  if (!project || !lot) fail("projet et lot requis");
  const k = key(project, lot);
  if (running.has(k)) {
    fail(`${lot} est déjà tenu (pid ${running.get(k).pid}) — un lot, un orchestrateur`);
  }

  const commande = agentCommand();
  if (!commande) {
    fail(
      "aucune commande d'agent configurée — poser RASTER_AGENT_CMD dans l'environnement local. " +
        "Raster ne stocke ni commande ni clé (CADRE : le dépôt suffit à lire, pas à exécuter)."
    );
  }

  const wt = addWorktree(project, lot, souslot);
  const etat = {
    project,
    lot,
    souslot,
    branch: wt.branch,
    cwd: wt.path,
    depuis: new Date().toISOString(),
    etat: "en cours",
    code: null,
    sortie: [],
    pid: 0,
    child: null,
  };

  const child = spawn(commande.cmd, commande.args, {
    cwd: wt.path,
    env: process.env,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });

  etat.child = child;
  etat.pid = child.pid || 0;

  const pousse = (buf) => {
    for (const l of String(buf).split(/\r?\n/)) {
      if (l.trim()) etat.sortie.push(l);
    }
    if (etat.sortie.length > MAX_LIGNES) {
      etat.sortie.splice(0, etat.sortie.length - MAX_LIGNES);
    }
  };
  child.stdout?.on("data", pousse);
  child.stderr?.on("data", pousse);

  child.on("error", (e) => {
    etat.etat = "échec";
    etat.sortie.push(`erreur de lancement : ${e.message}`);
  });
  child.on("exit", (code) => {
    etat.etat = code === 0 ? "fini" : "échec";
    etat.code = code;
    etat.child = null;
    // Le lot est libéré : sinon un processus mort le tiendrait pour toujours.
    running.delete(k);
    termines.push({ ...etat, sortie: etat.sortie.slice(-40) });
    if (termines.length > 20) termines.shift();
  });

  if (brief && child.stdin) {
    child.stdin.write(brief);
    child.stdin.end();
  }

  running.set(k, etat);
  return { project, lot, branch: wt.branch, cwd: wt.path, pid: etat.pid };
}

/** Les derniers lots terminés — pour lire une sortie après coup. */
const termines = [];

export function recent() {
  return termines.map((t) => ({
    project: t.project,
    lot: t.lot,
    branch: t.branch,
    etat: t.etat,
    code: t.code,
    depuis: t.depuis,
    sortie: t.sortie,
  }));
}

/**
 * Attend la fin d'un lot lancé dans CE processus. Résout `{ code }`.
 * Sans ça, un `run` en ligne de commande rendrait la main en laissant un orphelin.
 */
export function waitFor(project, lot, { onLigne } = {}) {
  const r = running.get(key(project, lot));
  if (!r || !r.child) return Promise.resolve({ code: 0 });
  if (onLigne) {
    r.child.stdout?.on("data", (b) => onLigne(String(b)));
    r.child.stderr?.on("data", (b) => onLigne(String(b)));
  }
  return new Promise((resolve) => {
    r.child.on("exit", (code) => resolve({ code }));
    r.child.on("error", () => resolve({ code: 1 }));
  });
}

export function stop(project, lot) {
  const k = key(project, lot);
  const r = running.get(k);
  if (!r) fail(`${lot} n'est pas tenu`);
  r.child?.kill();
  running.delete(k);
  return { project, lot, arrete: true };
}

export function formatRunning(rows) {
  if (!rows.length) return "aucun lot en cours";
  return rows
    .map(
      (r) =>
        `▸ ${`${r.project}/${r.lot}`.padEnd(34)} pid ${String(r.pid).padEnd(7)} ${r.branch}`
    )
    .join("\n");
}

export { REPO_ROOT, worktreePath };
