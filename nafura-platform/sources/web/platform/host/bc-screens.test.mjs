import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { products } from '../../../../scripts/nafura.mjs';

const repo = fileURLToPath(new URL('../../../../../', import.meta.url));
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const PLACEMENTS = new Set(['page', 'section', 'listing-header']);

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

function placementsOf(screen) {
  const raw = screen.placement;
  if (raw == null) return ['page'];
  return Array.isArray(raw) ? raw : [raw];
}

function countUsages(web) {
  const files = walk(web).filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes(`${sep}screens${sep}`));
  let sections = 0;
  let headers = 0;
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    sections += source.match(/kind:\s*['"]screen['"]/g)?.length ?? 0;
    headers += source.match(/\bloadHeader\s*:/g)?.length ?? 0;
  }
  return { sections, headers };
}

for (const product of products()) {
  const bcs = join(repo, product.dir, 'bcs');
  if (!existsSync(bcs)) continue;
  for (const bc of readdirSync(bcs)) {
    const web = join(bcs, bc, 'web');
    const manifestPath = join(bcs, bc, 'bc.manifest.json');
    if (!existsSync(web) || !existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const screens = manifest.spec?.screens ?? [];
    const declared = new Set(screens.map((screen) => screen.id));
    const byId = new Map(screens.map((screen) => [screen.id, screen]));

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

      for (const screen of screens) {
        const places = placementsOf(screen);
        for (const place of places) {
          assert.ok(PLACEMENTS.has(place), `${screen.id}: unknown placement "${place}"`);
        }
      }

      const usages = countUsages(web);
      // loadScreen / kind screen and loadHeader must point at a declared screen with the matching placement.
      const configFiles = walk(web).filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes(`${sep}screens${sep}`));
      const offenders = [];
      for (const file of configFiles) {
        const source = readFileSync(file, 'utf8');
        const sectionImports = [...source.matchAll(/screens\/([a-z][a-z0-9-]*)\//g)].map((m) => m[1]);
        for (const id of new Set(sectionImports)) {
          const screen = byId.get(id);
          if (!screen) {
            offenders.push(`${relative(web, file)}: screen "${id}" not declared`);
            continue;
          }
          const places = placementsOf(screen);
          const usedAsSection = /kind:\s*['"]screen['"]/.test(source) || /loadScreen\s*:/.test(source);
          const usedAsHeader = /loadHeader\s*:/.test(source) || /\bheader\s*:\s*(?:[A-Z]|\(\)\s*=>)/.test(source);
          if (usedAsSection && !places.includes('section') && !places.includes('page')) {
            // section requires placement section (page alone is not enough for in-fiche)
          }
          if (usedAsSection && !places.includes('section')) {
            offenders.push(`${relative(web, file)}: screen "${id}" used as section without placement "section"`);
          }
          if (usedAsHeader && !places.includes('listing-header')) {
            offenders.push(`${relative(web, file)}: screen "${id}" used as listing header without placement "listing-header"`);
          }
        }
      }
      assert.deepEqual(offenders, [], 'screen placement mismatch');

      console.log(
        `${product.dir}/${bc}: ${declared.size} specific screen(s), ${usages.sections} section(s), ${usages.headers} listing-header(s)`,
      );
    });
  }
}
