#!/usr/bin/env node
// Internal product tool. A product is app.nafura.json + bcs/ + brand; everything else is copied unchanged
// from the reference product (platform-host) and reads app.nafura.json, so nothing is renamed (D-16).
//   node nafura-platform/scripts/nafura.mjs new <id> --name "<Product name>"
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKSPACE = fileURLToPath(new URL('../../', import.meta.url));
const REFERENCE = join(WORKSPACE, 'platform-host');

/** Product files outside app.nafura.json and bcs/: identical in every product. */
export const ENTRY_POINTS = [
  'ops/run.mjs',
  'ops/k8s/staging/kustomization.yaml',
  'ops/k8s/prod/kustomization.yaml',
  'sources/backend/build.gradle',
  'sources/backend/settings.gradle.kts',
  'sources/backend/gradle.properties',
  'sources/backend/gradlew',
  'sources/backend/gradlew.bat',
  'sources/backend/gradle/wrapper/gradle-wrapper.jar',
  'sources/backend/gradle/wrapper/gradle-wrapper.properties',
  'sources/web/.npmrc',
  'sources/web/angular.json',
  'sources/web/package.json',
  'sources/web/package-lock.json',
  'sources/web/tsconfig.json',
  'sources/web/tsconfig.app.json',
  'sources/web/src/main.ts',
  'sources/web/src/index.html',
  'sources/web/src/styles.scss',
];

/** Starter brand: the product replaces it (spec.product.mark). */
const STARTER = ['sources/web/public/brand/mark.svg'];

/** Products of the workspace: top-level folders with an app.nafura.json. */
export function products() {
  return readdirSync(WORKSPACE)
    .filter((name) => existsSync(join(WORKSPACE, name, 'app.nafura.json')))
    .map((name) => ({ dir: name, app: JSON.parse(readFileSync(join(WORKSPACE, name, 'app.nafura.json'), 'utf8')) }));
}

/** Local ports nobody else uses, so several products run side by side. */
export function freePorts(existing) {
  const used = existing.map(({ app }) => app.spec.local?.ports).filter(Boolean);
  return {
    api: Math.max(8089, ...used.map((ports) => ports.api)) + 1,
    web: Math.max(4399, ...used.map((ports) => ports.web)) + 1,
  };
}

export function applicationManifest(id, name, ports) {
  return {
    $schema: '../nafura-platform/sources/web/platform/schemas/app.nafura.schema.json',
    apiVersion: 'nafura.io/v1',
    kind: 'application',
    metadata: { id: `app.${id}`, version: '0.1.0', owner: 'nafuralabs', lifecycle: 'experimental' },
    spec: {
      product: { name, mark: '/brand/mark.svg' },
      runtime: { tenancy: 'single', defaultRoute: '/' },
      shell: {
        topBar: { enabled: true, pageContext: true },
        sidebar: { enabled: true },
        userMenu: { enabled: true, userSettings: true },
        tenantMenu: {
          enabled: true,
          tenantSettings: true,
          tenantSettingsRoute: '/organization/settings',
          organizationIdentity: true,
          organizationIdentityRoute: '/organization/identity',
        },
        notifications: { enabled: true },
        ai: { enabled: true },
      },
      businessContexts: [],
      capabilities: { disabled: [] },
      roles: [],
      i18n: { locales: ['fr'] },
      local: {
        ports,
        users: [{ email: `admin@${id}.local`, givenName: 'Admin', familyName: name, role: 'SUPER_ADMIN' }],
      },
    },
  };
}

function create(id, name) {
  if (!/^[a-z][a-z0-9-]*$/.test(id ?? '')) throw new Error('The id is lowercase letters, digits and dashes, starting with a letter (e.g. acme-erp).');
  if (!name) throw new Error('--name "<Product name>" is required.');
  const target = join(WORKSPACE, id);
  if (existsSync(target)) throw new Error(`${relative(WORKSPACE, target)} already exists.`);

  for (const file of [...ENTRY_POINTS, ...STARTER]) {
    mkdirSync(join(target, file, '..'), { recursive: true });
    cpSync(join(REFERENCE, file), join(target, file));
  }
  mkdirSync(join(target, 'bcs'), { recursive: true });
  writeFileSync(join(target, 'bcs/.gitkeep'), '');
  const manifest = applicationManifest(id, name, freePorts(products()));
  writeFileSync(join(target, 'app.nafura.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Created ${id}/ (${name}): app.nafura.json, empty bcs/, entry points from platform-host.

Next:
  cd ${id}/sources/web && npm ci        # once
  node ${id}/ops/run.mjs lab            # http://localhost:${manifest.spec.local.ports.web}
Then add business contexts under ${id}/bcs/ and list them in spec.businessContexts.`);
}

/** Entry points that drifted from the reference product (the platform-host copy is the template). */
export function drift(productDir) {
  return ENTRY_POINTS.filter((file) => {
    const own = join(WORKSPACE, productDir, file);
    if (!existsSync(own)) return true;
    const reference = join(REFERENCE, file);
    return statSync(own).size !== statSync(reference).size || !readFileSync(own).equals(readFileSync(reference));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, id, ...rest] = process.argv.slice(2);
  const nameIndex = rest.indexOf('--name');
  try {
    if (command === 'new') create(id, nameIndex >= 0 ? rest[nameIndex + 1] : undefined);
    else {
      console.log('usage: node nafura-platform/scripts/nafura.mjs new <id> --name "<Product name>"');
      process.exitCode = command ? 2 : 0;
    }
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
