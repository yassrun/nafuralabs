#!/usr/bin/env node
/**
 * Minimal Raster CLI — orchestrator write path (see raster/AGENTS.md).
 *
 *   node raster/t.mjs index
 *   node raster/regen.mjs
 */
import { regen } from "./regen.mjs";

const [cmd] = process.argv.slice(2);

function usage() {
  console.log(`usage: node raster/t.mjs <command>

  index     regen INDEX.tsv + SPRINT.md + BACKLOG.md
            (walk products/* et peers racine **/docs/specs/lots/**/tasks)
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

console.error(`unknown command: ${cmd}`);
usage();
process.exit(1);
