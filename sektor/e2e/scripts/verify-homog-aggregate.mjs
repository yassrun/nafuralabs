/**
 * SEKTOR-298 — agrégat gates rg vs baseline homogenisation-ux.
 * Runs the four module scripts then prints residual counts on the 4 modules.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const scripts = [
  'verify-homog-etudes.mjs',
  'verify-homog-chantiers.mjs',
  'verify-homog-catalogue.mjs',
  'verify-homog-achats.mjs',
];

for (const s of scripts) {
  const r = spawnSync(process.execPath, [path.join(HERE, s)], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function count(mod, pat) {
  try {
    const out = execSync(
      `rg -c ${JSON.stringify(pat)} ${JSON.stringify(path.join(ROOT, 'sektor/sources/web/app', mod))} -g "*.html" -g "*.ts"`,
      { encoding: 'utf8' },
    );
    let s = 0;
    for (const line of out.trim().split(/\n/).filter(Boolean)) {
      const m = line.match(/:(\d+)$/);
      if (m) s += Number(m[1]);
    }
    return s;
  } catch (e) {
    const out = e.stdout ? String(e.stdout) : '';
    let s = 0;
    for (const line of out.trim().split(/\n/).filter(Boolean)) {
      const m = line.match(/:(\d+)$/);
      if (m) s += Number(m[1]);
    }
    return s;
  }
}

const baseline = {
  etudes: { button: 81, select: 17 },
  achats: { button: 0, select: 2 },
  catalogue: { button: 15, select: 8 },
  chantiers: { button: 31, select: 29 },
};

console.log('\nResidual counts (must be <= baseline 31/08):');
for (const mod of ['etudes', 'achats', 'catalogue', 'chantiers']) {
  const b = count(mod, '<button\\b');
  const s = count(mod, '<select\\b');
  const bb = baseline[mod];
  console.log(
    `  ${mod.padEnd(10)} button=${b} (base ${bb.button})  select=${s} (base ${bb.select})`,
  );
  if (b > bb.button) {
    console.error(`FAIL  ${mod} button count rose above baseline`);
    process.exit(1);
  }
  if (s > bb.select) {
    console.error(`FAIL  ${mod} select count rose above baseline`);
    process.exit(1);
  }
}

console.log('PASS  SEKTOR-298 homogenisation-ux aggregate gates');
