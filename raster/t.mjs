#!/usr/bin/env node
/**
 * Raster CLI — la seule voie d'écriture d'une task (`AGENTS.md` §0.1-9).
 *
 * Lecture :  index · check · ready · window
 * Écriture : new · promote · status · approve   (chacune régénère)
 * Archive :  sweep
 */
import { regen } from "./regen.mjs";
import { check } from "./check.mjs";
import { sweep } from "./sweep.mjs";
import { readiness, formatReadiness } from "./ready.mjs";
import { window_, formatWindow } from "./roadmap.mjs";
import {
  createTask,
  promoteLine,
  setStatus,
  approve,
  RefusError,
} from "./write.mjs";
import {
  addWorktree,
  removeWorktree,
  listWorktrees,
  formatWorktrees,
  WorktreeError,
} from "./worktree.mjs";
import {
  start,
  stop,
  waitFor,
  list as running,
  formatRunning,
  SpawnError,
} from "./spawn.mjs";
import { listRasterProjects } from "./walk-tasks.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const argv = process.argv.slice(2);
const [cmd] = argv;

/** `--cle valeur` et `--drapeau`. Le reste est positionnel, dans l'ordre. */
function parseArgs(list) {
  const flags = {};
  const pos = [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a.startsWith("--")) {
      pos.push(a);
      continue;
    }
    const key = a.slice(2);
    const next = list[i + 1];
    if (next === undefined || next.startsWith("--")) flags[key] = true;
    else {
      flags[key] = next;
      i++;
    }
  }
  return { flags, pos };
}

const list = (v) =>
  typeof v === "string"
    ? v.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

function usage() {
  console.log(`usage: node raster/t.mjs <commande>

  lecture
    index                       regen INDEX.tsv + BACKLOG.md
    check                       valide le canon — sort en 1 si erreur
    ready [projet] [--json]     sous-lots lançables maintenant
    window [projet] [--json]    fenêtre de la roadmap (au-dessus de la borne)

  écriture — régénèrent les vues
    new <projet> <lot[/sous-lot]> "<titre>"
        [--type feature|bug|tech|spec|physical|qa] [--priority P0..P3]
        [--assignee me|agent|either] [--gate none|me] [--context nafura|saham|personal]
        [--blocked-by ID,ID] [--tags a,b] [--note "…"] [--nouveau-lot]
    promote "<ligne inbox>" <projet> <lot[/sous-lot]>
      [--priority P0..P3] [--assignee me|agent|either] [--gate none|me]
    status <id> <statut>        todo|doing|blocked|review|done-agent
    approve <id>                done-agent + gate:me → done-me

  exécution — la commande d'agent vient de RASTER_AGENT_CMD, jamais du dépôt
    worktree list                       les worktrees d'agent (hors dépôt)
    worktree add <projet> <lot> [sous-lot]    crée branche + worktree
    worktree rm  <projet> <lot> [sous-lot]    retire le worktree, garde la branche
    run <projet> <lot> [sous-lot]             lance un orchestrateur
    running                             les lots tenus
    stop <projet> <lot>                 arrête et libère le lot

  archive
    sweep [--dry]               supprime les done-me · Git porte l'histoire
`);
}

function run() {
  if (!cmd || cmd === "-h" || cmd === "--help") {
    usage();
    process.exit(cmd ? 0 : 1);
  }

  const { flags, pos } = parseArgs(argv.slice(1));

  if (cmd === "index") {
    const r = regen();
    console.log(`INDEX/BACKLOG regen — ${r.tasks} live · ${r.projects} projets`);
    return 0;
  }

  if (cmd === "check") {
    const { errors, warnings, tasks } = check();
    for (const w of warnings) console.log(`WARN  ${w.at}\n      ${w.msg}`);
    for (const e of errors) console.log(`ERROR ${e.at}\n      ${e.msg}`);
    console.log(`check — ${tasks} tasks · ${errors.length} erreurs · ${warnings.length} warnings`);
    return errors.length ? 1 : 0;
  }

  if (cmd === "sweep") {
    const dry = argv.includes("--dry");
    const removed = sweep({ dry });
    for (const r of removed) console.log(`${dry ? "would remove" : "removed"}  ${r.id}  ${r.at}`);
    console.log(`sweep — ${removed.length} task(s) done-me ${dry ? "à supprimer" : "supprimée(s)"}`);
    if (!dry && removed.length) regen();
    return 0;
  }

  if (cmd === "ready") {
    const rows = readiness(pos[0] || "");
    console.log(flags.json ? JSON.stringify(rows, null, 2) : formatReadiness(rows));
    return 0;
  }

  if (cmd === "window") {
    const projets = pos.length ? pos : listRasterProjects(REPO_ROOT);
    const out = projets.map((p) => window_(p));
    console.log(flags.json ? JSON.stringify(out, null, 2) : out.map(formatWindow).join("\n\n"));
    return 0;
  }

  if (cmd === "new") {
    const [project, target, ...rest] = pos;
    const r = createTask({
      project,
      target,
      title: rest.join(" "),
      type: flags.type || "feature",
      priority: flags.priority || "P2",
      assignee: flags.assignee || "agent",
      gate: flags.gate || "none",
      context: flags.context || "nafura",
      agent_type: flags["agent-type"] || "",
      blocked_by: list(flags["blocked-by"]),
      tags: list(flags.tags),
      note: typeof flags.note === "string" ? flags.note : "",
      nouveauLot: flags["nouveau-lot"] === true,
    });
    regen();
    console.log(`${r.id}  ${r.file}`);
    return 0;
  }

  if (cmd === "promote") {
    const [line, project, target] = pos;
    const r = promoteLine(line, project, target, {
      type: "spec",
      priority: flags.priority || "P2",
      assignee: flags.assignee || "agent",
      gate: flags.gate || "none",
    });
    regen();
    console.log(`${r.id}  ${r.file}  · ligne retirée de raster/inbox.md`);
    return 0;
  }

  if (cmd === "status") {
    const r = setStatus(pos[0], pos[1]);
    regen();
    console.log(`${r.id}  status: ${r.status}`);
    return 0;
  }

  if (cmd === "approve") {
    const r = approve(pos[0]);
    regen();
    console.log(`${r.id}  status: done-me — \`t.mjs sweep\` la sortira du dépôt`);
    return 0;
  }

  if (cmd === "worktree") {
    const [sub, project, lot, souslot] = pos;
    if (sub === "list" || !sub) {
      console.log(formatWorktrees(listWorktrees()));
      return 0;
    }
    if (sub === "add") {
      const r = addWorktree(project, lot, souslot);
      console.log(`${r.branch}  ${r.path}${r.cree ? "" : "  (existait déjà)"}`);
      return 0;
    }
    if (sub === "rm") {
      const r = removeWorktree(project, lot, souslot, { force: flags.force === true });
      console.log(r.retire ? `retiré  ${r.path}` : `rien à retirer  ${r.path}`);
      return 0;
    }
    console.error(`worktree : sous-commande inconnue "${sub}"`);
    return 1;
  }

  // `run` ATTEND son agent : l'état vit en mémoire, rendre la main l'orphelinerait.
  if (cmd === "run") {
    const [project, lot, souslot] = pos;
    const r = start({ project, lot, souslot: souslot || "" });
    console.log(`▸ ${r.project}/${r.lot}  pid ${r.pid}  ${r.branch}\n  ${r.cwd}\n`);
    return waitFor(project, lot, {
      onLigne: (s) => process.stdout.write(s),
    }).then(({ code }) => {
      console.log(`\n${code === 0 ? "fini" : `échec (code ${code})`} — ${lot}`);
      return code === 0 ? 0 : 1;
    });
  }

  if (cmd === "running") {
    const rows = running();
    if (flags.json) console.log(JSON.stringify(rows, null, 2));
    else {
      console.log(formatRunning(rows));
      if (!rows.length) {
        console.log("(l'état vit dans le processus qui a lancé — voir l'app)");
      }
    }
    return 0;
  }

  if (cmd === "stop") {
    const r = stop(pos[0], pos[1]);
    console.log(`arrêté  ${r.project}/${r.lot}`);
    return 0;
  }

  console.error(`commande inconnue : ${cmd}`);
  usage();
  return 1;
}

/** Un refus est une erreur d'appel, pas une panne : code 2, pas de pile. */
function onErreur(e) {
  if (e instanceof RefusError || e instanceof WorktreeError || e instanceof SpawnError) {
    console.error(`refus — ${e.message}`);
    process.exit(2);
  }
  throw e;
}

try {
  const r = run();
  // `run` est la seule commande asynchrone : elle attend son agent.
  if (r instanceof Promise) r.then((code) => process.exit(code), onErreur);
  else process.exit(r);
} catch (e) {
  onErreur(e);
}
