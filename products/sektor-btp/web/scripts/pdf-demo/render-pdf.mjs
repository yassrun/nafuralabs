/**
 * Demo PDF renderer — wraps Playwright CLI (no extra runtime deps beyond @playwright/test).
 *
 * Usage:
 *   node scripts/pdf-demo/render-pdf.mjs <url-or-path> [output.pdf]
 *
 * Examples:
 *   npm run start -- --host 127.0.0.1 --port 4200
 *   node scripts/pdf-demo/render-pdf.mjs http://127.0.0.1:4200/dashboard dist-demo/dashboard.pdf
 *
 * Contract (demo):
 *   - Input: absolute http(s) URL, or path to a local .html file (file:// generated internally).
 *   - Output: path to a .pdf file (parent dirs created if missing).
 */
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const input = process.argv[2];
const outArg = process.argv[3] ?? 'dist-demo/out.pdf';

if (!input) {
  console.error('Usage: node scripts/pdf-demo/render-pdf.mjs <url-or-html-path> [output.pdf]');
  process.exit(1);
}

const out = resolve(outArg);
const dir = dirname(out);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const target = input.startsWith('http://') || input.startsWith('https://')
  ? input
  : `file:///${resolve(input).replace(/\\/g, '/')}`;

execSync(`npx playwright pdf "${target}" "${out}"`, { stdio: 'inherit', shell: true });
