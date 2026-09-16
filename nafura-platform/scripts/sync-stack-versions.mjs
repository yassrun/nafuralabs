#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const write = process.argv.includes('--write');
const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const catalogPath = resolve(repositoryRoot, 'nafura-platform', 'stack.versions.properties');
const products = [
  'nafura-platform/sources/web',
  'sektor/sources/web',
  'venue-catalog/sources/web',
  'sandbox/sources/web',
];
const versionKeys = {
  '@angular/animations': 'angular-animations.version',
  '@angular/cdk': 'angular-cdk.version',
  '@angular/common': 'angular.version',
  '@angular/compiler': 'angular.version',
  '@angular/compiler-cli': 'angular.version',
  '@angular/core': 'angular.version',
  '@angular/forms': 'angular.version',
  '@angular/platform-browser': 'angular.version',
  '@angular/platform-browser-dynamic': 'angular.version',
  '@angular/router': 'angular.version',
  '@angular/material': 'angular-material.version',
  '@angular/cli': 'angular-cli.version',
  '@angular-devkit/build-angular': 'angular-devkit.version',
  typescript: 'typescript.version',
  rxjs: 'rxjs.version',
};

function parseProperties(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );
}

function withExistingRange(version, target) {
  const prefix = version.match(/^[~^]/)?.[0] ?? '';
  return `${prefix}${target}`;
}

const catalog = parseProperties(await readFile(catalogPath, 'utf8'));
let drift = false;

for (const product of products) {
  const productPath = resolve(repositoryRoot, product);
  const packagePath = resolve(productPath, 'package.json');
  const overridesPath = resolve(productPath, 'stack.versions.override.properties');
  const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
  let overrides = {};
  try {
    overrides = parseProperties(await readFile(overridesPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  let changed = false;
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const dependencies = manifest[section];
    if (!dependencies) continue;
    for (const [dependency, versionKey] of Object.entries(versionKeys)) {
      if (!(dependency in dependencies)) continue;
      const target = overrides[versionKey] ?? catalog[versionKey];
      if (!target) throw new Error(`Missing ${versionKey} in ${catalogPath}`);
      const expected = withExistingRange(dependencies[dependency], target);
      if (dependencies[dependency] === expected) continue;
      drift = true;
      changed = true;
      console.log(`${product}: ${dependency} ${dependencies[dependency]} -> ${expected}`);
      dependencies[dependency] = expected;
    }
  }

  if (changed && write) {
    await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

if (drift && !write) {
  console.error('Stack version drift found. Run: node nafura-platform/scripts/sync-stack-versions.mjs --write');
  process.exitCode = 1;
} else if (!drift) {
  console.log('Stack versions: aligned');
}
