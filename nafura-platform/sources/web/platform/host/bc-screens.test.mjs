import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { products } from '../../../../scripts/nafura.mjs';

const repo = fileURLToPath(new URL('../../../../../', import.meta.url));
const HEX = /#[0-9a-fA-F]{3,8}\b/;

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

for (const product of products()) {
  const bcs = join(repo, product.dir, 'bcs');
  if (!existsSync(bcs)) continue;
  for (const bc of readdirSync(bcs)) {
    const web = join(bcs, bc, 'web');
    const manifestPath = join(bcs, bc, 'bc.manifest.json');
    if (!existsSync(web) || !existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const declared = new Set((manifest.spec?.screens ?? []).map((screen) => screen.id));

    test(`${product.dir}/${bc} specific screens are declared and stay inside the façade`, () => {
      const files = walk(web);
      const components = files.filter((file) => readFileSync(file, 'utf8').includes('@Component'));
      const outside = components
        .map((file) => relative(web, file).split(sep).join('/'))
        .filter((file) => !/^screens\/[a-z][a-z0-9-]*\//.test(file) || !declared.has(file.split('/')[1]));
      assert.deepEqual(outside, [], 'component outside a declared screens/<id>/ folder');

      const missing = [...declared].filter((id) => !existsSync(join(web, 'screens', id)));
      assert.deepEqual(missing, [], 'declared screen without a folder');

      const anatomy = files.filter((file) => /lib\/anatomy|@platform\/lib/.test(readFileSync(file, 'utf8')));
      assert.deepEqual(anatomy.map((file) => relative(web, file)), [], 'a screen imports lib/anatomy');

      const styles = files.filter((file) => /\.(scss|css)$/.test(file));
      assert.deepEqual(styles.map((file) => relative(web, file)), [], 'a business context web folder has a stylesheet');

      const colors = files
        .filter((file) => /\.(ts|html)$/.test(file) && HEX.test(readFileSync(file, 'utf8')))
        .map((file) => relative(web, file));
      assert.deepEqual(colors, [], 'hex color in a business context web folder');

      console.log(`${product.dir}/${bc}: ${declared.size} specific screen(s)`);
    });
  }
}
