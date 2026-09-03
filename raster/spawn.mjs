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
import {
  availableModes,
  executionCommand,
  normalizeMode,
} from "./execution-mode.mjs";
import { setStatus } from "./write.mjs";
import { regen } from "./regen.mjs";

export class SpawnError extends Error {}

const fail = (m) => {
  throw new SpawnError(m);
};

/** sous-lot tenu → état. Une sous-session n'est jamais tenue deux fois. */
const running = new Map();

const key = (project, lot, souslot = "") => `${project}//${lot}//${souslot}`;

/** Taille du tampon de sortie gardé par lot — de quoi comprendre, pas de quoi archiver. */
const MAX_LIGNES = 400;

/**
 * La commande vient de l'environnement, jamais du dépôt.
 * Rien de configuré ⇒ on refuse en le disant.
 */
export function agentCommand(mode = "local") {
  return executionCommand(mode);
}

export function configuredModes() {
  return availableModes();
}

export function applyRunnerResult(line, allowedTaskIds, apply = setStatus) {
  if (!String(line).startsWith("RASTER_RESULT ")) return 0;
  const result = JSON.parse(String(line).slice("RASTER_RESULT ".length));
  const allowed = new Set(allowedTaskIds);
  let changed = 0;
  for (const id of result.done || []) {
    if (!allowed.has(id)) continue;
    apply(id, "done");
    changed++;
  }
  for (const id of result.blocked || []) {
    if (!allowed.has(id)) continue;
    apply(id, "blocked");
    changed++;
  }
  return changed;
}

export function isRunning(project, lot, souslot = "") {
  return running.has(key(project, lot, souslot));
}

export function list() {
  return [...running.values()].map((r) => ({
    project: r.project,
    lot: r.lot,
    souslot: r.souslot,
    mode: r.mode,
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
export function start({
  project,
  lot,
  souslot = "",
  brief = "",
  mode = "local",
  onExit,
  allowedTaskIds = [],
}) {
  if (!project || !lot) fail("projet et lot requis");
  const selectedMode = normalizeMode(mode);
  const k = key(project, lot, souslot);
  if (running.has(k)) {
    fail(`${lot}/${souslot || "général"} est déjà tenu (pid ${running.get(k).pid})`);
  }

  if (!brief.trim()) {
    fail("brief de sous-session requis");
  }
  const commande = agentCommand(selectedMode);
  if (!commande) {
    fail(
      `mode ${selectedMode} non configuré — poser ${
        selectedMode === "agents" ? "RASTER_AGENTS_CMD" : "RASTER_LOCAL_CMD"
      } dans l'environnement local`
    );
  }

  const wt = addWorktree(project, lot, souslot);
  const etat = {
    project,
    lot,
    souslot,
    mode: selectedMode,
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
    env: { ...process.env, RASTER_EXECUTION_MODE: selectedMode },
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });

  etat.child = child;
  etat.pid = child.pid || 0;
  let pendingOutput = "";

  const pousse = (buf) => {
    pendingOutput += String(buf);
    const lines = pendingOutput.split(/\r?\n/);
    pendingOutput = lines.pop() || "";
    for (const l of lines) {
      if (l.trim()) etat.sortie.push(l);
      if (!l.startsWith("RASTER_RESULT ")) continue;
      try {
        if (applyRunnerResult(l, allowedTaskIds)) regen();
      } catch (error) {
        etat.sortie.push(`résultat runner ignoré : ${error.message}`);
      }
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
    if (pendingOutput.trim()) pousse("\n");
    etat.etat = code === 0 ? "fini" : "échec";
    etat.code = code;
    etat.child = null;
    // Le lot est libéré : sinon un processus mort le tiendrait pour toujours.
    running.delete(k);
    termines.push({ ...etat, sortie: etat.sortie.slice(-40) });
    if (termines.length > 20) termines.shift();
    if (onExit) queueMicrotask(() => onExit({ code: code ?? 1 }));
  });

  if (child.stdin) {
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
    souslot: t.souslot,
    mode: t.mode,
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
export function waitFor(project, lot, souslot = "", { onLigne } = {}) {
  const r = running.get(key(project, lot, souslot));
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

export function stop(project, lot, souslot = "") {
  const k = key(project, lot, souslot);
  const r = running.get(k);
  if (!r) fail(`${lot} n'est pas tenu`);
  r.child?.kill();
  running.delete(k);
  return { project, lot, souslot, arrete: true };
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
