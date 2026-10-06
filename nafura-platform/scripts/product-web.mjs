#!/usr/bin/env node
// Product web entry: derives what the product would otherwise repeat from app.nafura.json, then runs Angular.
//   node product-web.mjs prepare|serve|build [ng args…]   (cwd: <product>/sources/web)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const web = process.cwd();
const product = resolve(web, '../..');
const app = JSON.parse(readFileSync(join(product, 'app.nafura.json'), 'utf8'));

/**
 * spec.businessContexts → src/business-contexts.generated.ts (git-ignored): main.ts stays the same in every product.
 * Only each BC's manifest is imported at startup; its screens (and the archetypes they pull) load on first visit.
 */
export function businessContextsModule(ids, exists = (path) => existsSync(join(product, path))) {
  const entries = ids.map((id, index) => {
    const dir = `bcs/${id.replace(/^bc\./, '')}`;
    if (!exists(`${dir}/web/index.ts`)) throw new Error(`app.nafura.json lists '${id}' but ${dir}/web/index.ts does not exist.`);
    if (!exists(`${dir}/bc.manifest.json`)) throw new Error(`app.nafura.json lists '${id}' but ${dir}/bc.manifest.json does not exist.`);
    return {
      importLine: `import manifest${index} from '../../../${dir}/bc.manifest.json';`,
      entry: `  { manifest: manifest${index} as BusinessContextManifest, load: () => import('../../../${dir}/web') },`,
    };
  });
  return [
    '// Generated from app.nafura.json (spec.businessContexts) by nafura-platform/scripts/product-web.mjs. Do not edit.',
    "import type { LazyHostBusinessContext } from '@platform/platform/host';",
    "import type { BusinessContextManifest } from '@platform/platform/manifest';",
    ...entries.map((e) => e.importLine),
    '',
    'export const businessContexts: readonly LazyHostBusinessContext[] = [',
    ...entries.map((e) => e.entry),
    '];',
    '',
  ].join('\n');
}

function prepare() {
  writeFileSync(join(web, 'src/business-contexts.generated.ts'), businessContextsModule(app.spec.businessContexts ?? []));
}

function ng(args) {
  const cli = join(web, 'node_modules/@angular/cli/bin/ng.js');
  const result = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}

const [command, ...rest] = process.argv.slice(2);
if (command === 'prepare') {
  prepare();
} else if (command === 'serve') {
  prepare();
  // Platform sources sit outside the product web root. On Windows, Angular's native
  // watcher (Parcel) does not report those changes, so the browser never reloads.
  const poll = process.platform === 'win32' ? ['--poll', '1000'] : [];
  ng(['serve', '--host', '127.0.0.1', '--port', String(app.spec.local?.ports?.web ?? 4200), ...poll, ...rest]);
} else if (command === 'build') {
  prepare();
  ng(['build', ...rest]);
} else {
  console.error('usage: node product-web.mjs prepare|serve|build [ng args…]');
  process.exit(2);
}
