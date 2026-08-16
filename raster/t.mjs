#!/usr/bin/env node
/**
 * Raster CLI — la seule voie d'écriture d'une task (`AGENTS.md` §0.1-9).
 *
 * Lecture :  index · check · ready · window
 * Écriture : new · promote · sprint · status · approve   (chacune régénère)
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
  setSprint,
  setStatus,
  approve,
  RefusError,
} from "./write.mjs";
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
    index                       regen INDEX.tsv + SPRINT.md + BACKLOG.md
    check                       valide le canon — sort en 1 si erreur
    ready [projet] [--json]     sous-lots lançables maintenant
    window [projet] [--json]    fenêtre de la roadmap (au-dessus de la borne)

  écriture — régénèrent les vues
    new <projet> <lot[/sous-lot]> "<titre>"
        [--type feature|bug|tech|spec|physical|qa] [--priority P0..P3]
        [--assignee me|agent|either] [--gate none|me] [--context nafura|saham|personal]
        [--blocked-by ID,ID] [--tags a,b] [--note "…"] [--nouveau-lot]
    promote "<ligne inbox>" <projet> <lot[/sous-lot]>
    sprint <id> [YYYY-Wnn]      défaut = semaine courante
    status <id> <statut>        todo|doing|blocked|review|done-agent
    approve <id>                done-agent + gate:me → done-me

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
    console.log(`INDEX/SPRINT/BACKLOG regen — ${r.tasks} live · ${r.projects} projets`);
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
      priority: flags.priority || "P2",
      assignee: flags.assignee || "agent",
      gate: flags.gate || "none",
    });
    regen();
    console.log(`${r.id}  ${r.file}  · ligne retirée de raster/inbox.md`);
    return 0;
  }

  if (cmd === "sprint") {
    const r = setSprint(pos[0], pos[1]);
    regen();
    console.log(`${r.id}  sprint: ${r.sprint}`);
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

  console.error(`commande inconnue : ${cmd}`);
  usage();
  return 1;
}

try {
  process.exit(run());
} catch (e) {
  if (e instanceof RefusError) {
    console.error(`refus — ${e.message}`);
    process.exit(2);
  }
  throw e;
}
