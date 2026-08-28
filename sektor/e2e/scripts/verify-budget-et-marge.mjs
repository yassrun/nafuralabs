/**
 * Agrégat budget-et-marge — délègue à verify-budget-et-marge-248.mjs (Mode B).
 * Run: node sektor/e2e/scripts/verify-budget-et-marge.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'verify-budget-et-marge-248.mjs');
const r = spawnSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
process.exit(r.status ?? 1);
