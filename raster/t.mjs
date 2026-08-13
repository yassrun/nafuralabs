#!/usr/bin/env node
/**
 * Minimal Raster CLI — orchestrator write path (see raster/AGENTS.md).
 *
 *   node raster/t.mjs index
 *   node raster/t.mjs check
 */
import { regen } from "./regen.mjs";
import { check } from "./check.mjs";
import { sweep } from "./sweep.mjs";

const [cmd] = process.argv.slice(2);

function usage() {
  console.log(`usage: node raster/t.mjs <command>

  index     regen INDEX.tsv + SPRINT.md + BACKLOG.md
            (walk **/raster-src/lots/**/tasks — jamais pact/)
  check     valide le canon — sort en 1 si une erreur est trouvée
  sweep     supprime les tasks \`done-me\` (--dry pour voir sans supprimer)
`);
}

if (!cmd || cmd === "-h" || cmd === "--help") {
  usage();
  process.exit(cmd ? 0 : 1);
}

if (cmd === "index") {
  const r = regen();
  console.log(
    `INDEX/SPRINT/BACKLOG regen — ${r.tasks} live · ${r.projects} projets`
  );
  process.exit(0);
}

if (cmd === "check") {
  const { errors, warnings, tasks } = check();
  for (const w of warnings) console.log(`WARN  ${w.at}\n      ${w.msg}`);
  for (const e of errors) console.log(`ERROR ${e.at}\n      ${e.msg}`);
  console.log(
    `check — ${tasks} tasks · ${errors.length} erreurs · ${warnings.length} warnings`
  );
  process.exit(errors.length ? 1 : 0);
}

if (cmd === "sweep") {
  const dry = process.argv.includes("--dry");
  const removed = sweep({ dry });
  for (const r of removed) {
    console.log(`${dry ? "would remove" : "removed"}  ${r.id}  ${r.at}`);
  }
  console.log(
    `sweep — ${removed.length} task(s) done-me ${dry ? "à supprimer" : "supprimée(s)"}`
  );
  if (!dry && removed.length) regen();
  process.exit(0);
}

console.error(`unknown command: ${cmd}`);
usage();
process.exit(1);
