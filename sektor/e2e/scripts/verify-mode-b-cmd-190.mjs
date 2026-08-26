/**
 * SEKTOR-190 — one-shot Mode B command exists and is the agent contract.
 * Run: node sektor/e2e/scripts/verify-mode-b-cmd-190.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};
const read = (rel) => {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) fail(`missing ${rel}`);
  return readFileSync(abs, 'utf8');
};

const makefile = read('nafura-platform/ops/Makefile');
const modeB = read('nafura-platform/ops/mode-b.sh');
const helper = read('nafura-platform/ops/dev-staging-local.sh');
const rule = read('.cursor/rules/cursor-qa-browser.mdc');
const execSkill = read('.cursor/skills/nafura-exec/SKILL.md');
const qaSkill = read('.cursor/skills/nafura-qa/SKILL.md');
const specSkill = read('.cursor/skills/nafura-spec/SKILL.md');
const orchSkill = read('.cursor/skills/nafura-orch/SKILL.md');

if (!makefile.includes('mode-b:') || !makefile.includes('mode-b-stop:')) {
  fail('Makefile missing mode-b / mode-b-stop targets');
}
if (!makefile.includes('bash ./mode-b.sh start')) {
  fail('Makefile mode-b does not call mode-b.sh start');
}
if (!modeB.includes('dev-staging-local.sh') || !modeB.includes('start')) {
  fail('mode-b.sh does not dispatch start to dev-staging-local.sh');
}
if (!helper.includes('start_sektor_app') || !helper.includes('npm run start:erp:cursor')) {
  fail('dev-staging-local.sh does not launch start:erp:cursor');
}
if (!helper.includes(':sektor:app:bootRun')) {
  fail('dev-staging-local.sh does not launch bootRun');
}
const cmd = 'make -C nafura-platform/ops mode-b';
for (const [label, src] of [
  ['cursor-qa-browser.mdc', rule],
  ['nafura-exec', execSkill],
  ['nafura-qa', qaSkill],
  ['nafura-spec', specSkill],
  ['nafura-orch', orchSkill],
]) {
  if (!src.includes(cmd)) fail(`${label} does not cite ${cmd}`);
}

console.log('PASS  one-shot make mode-b in toolchain + Spec/Code/QA/Orch skills');
