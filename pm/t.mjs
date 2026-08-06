#!/usr/bin/env node
/**
 * Minimal PM CLI — single write path (see pm/AGENTS.md §6).
 * Today: index (regen views). Mutating commands land as the CLI grows.
 *
 *   node pm/t.mjs index
 *   node pm/regen.mjs
 */
import { regen } from "./regen.mjs";

const [cmd] = process.argv.slice(2);

function usage() {
  console.log(`usage: node pm/t.mjs <command>

  index     regen INDEX.tsv + SPRINT.md + BACKLOG.md
`);
}

if (!cmd || cmd === "-h" || cmd === "--help") {
  usage();
  process.exit(cmd ? 0 : 1);
}

if (cmd === "index") {
  const r = regen();
  console.log(`INDEX/SPRINT/BACKLOG regen — ${r.tasks} live · ${r.projects} projets`);
  process.exit(0);
}

console.error(`unknown command: ${cmd}`);
usage();
process.exit(1);
