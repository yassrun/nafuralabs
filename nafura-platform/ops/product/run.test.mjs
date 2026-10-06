import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { gradleUserHome, hostOf, imageOf, keycloakClientOf, labDataDir, namespaceOf, oidcOf, ownersOf, postmasterPid, renderKustomization } from './run.mjs';
import { toolchainPaths, toolchainRoot } from './toolchain.mjs';

const product = (spec = {}) => ({
  id: 'acme-erp',
  name: 'Acme ERP',
  ports: { api: 8095, web: 4405 },
  app: { metadata: { id: 'app.acme-erp' }, spec: { product: { name: 'Acme ERP' }, ...spec } },
});

test('a product is placed by convention from its id', () => {
  assert.equal(namespaceOf(product(), 'staging'), 'acme-erp-staging');
  assert.equal(hostOf(product(), 'staging'), 'acme-erp.nafuralabs.staging');
  assert.equal(hostOf(product(), 'prod'), 'acme-erp.nafuralabs.com');
  assert.equal(imageOf(product(), 'staging', 'backend'), 'acme-erp-backend:staging');
  assert.equal(imageOf(product(), 'prod', 'web'), '54.36.183.106:30500/nafura/acme-erp-web:prod');
});

test('app.nafura.json spec.deploy overrides the host', () => {
  assert.equal(hostOf(product({ deploy: { prod: { host: 'erp.acme.ma' } } }), 'prod'), 'erp.acme.ma');
});

test('the rendered kustomization places the product overlay in its namespace, images and host', () => {
  const staging = renderKustomization(product(), 'staging');
  assert.match(staging, /namespace: acme-erp-staging/);
  assert.match(staging, /- \.\.\/\.\.\/k8s\/staging/);
  assert.match(staging, /name: backend, newName: acme-erp-backend, newTag: staging/);
  assert.match(staging, /value: acme-erp\.nafuralabs\.staging/);
  assert.doesNotMatch(staging, /tls/);

  const prod = renderKustomization(product(), 'prod');
  assert.match(prod, /name: web, newName: 54\.36\.183\.106:30500\/nafura\/acme-erp-web, newTag: prod/);
  assert.match(prod, /hosts: \["acme-erp\.nafuralabs\.com"\]/);
});

test('the backend trusts the shared realm of its environment, keys fetched in-cluster', () => {
  assert.deepEqual(oidcOf('prod'), {
    issuer: 'https://iam.nafuralabs.com/realms/iam-portal',
    jwkSetUri: 'http://keycloak.nafura-infra-prod.svc:8080/realms/iam-portal/protocol/openid-connect/certs',
  });
  assert.equal(oidcOf('staging', { inCluster: false }).jwkSetUri, 'http://iam.nafuralabs.staging/realms/iam-portal/protocol/openid-connect/certs');

  const rendered = renderKustomization(product({ deploy: { prod: { owners: ['a@acme.ma', 'b@acme.ma'] } } }), 'prod');
  assert.match(rendered, /name: KEYCLOAK_ISSUER_URI, value: "https:\/\/iam\.nafuralabs\.com\/realms\/iam-portal"/);
  assert.match(rendered, /name: NAFURA_OWNERS, value: "a@acme\.ma,b@acme\.ma"/);
  assert.doesNotMatch(rendered, /JWT_SECRET/);
});

test('owners must be plain emails: they reach a shell in the Keycloak pod', () => {
  assert.deepEqual(ownersOf(product(), 'staging'), []);
  assert.throws(() => ownersOf(product({ deploy: { staging: { owners: ["x@y.z'; rm -rf /"] } } }), 'staging'), /not an email/);
});

test('the product client is public, code + PKCE only, redirecting to its own origins', () => {
  const staging = keycloakClientOf(product(), 'staging');
  assert.equal(staging.clientId, 'acme-erp');
  assert.equal(staging.publicClient, true);
  assert.equal(staging.directAccessGrantsEnabled, false);
  assert.equal(staging.implicitFlowEnabled, false);
  assert.equal(staging.attributes['pkce.code.challenge.method'], 'S256');
  assert.deepEqual(staging.redirectUris, ['http://acme-erp.nafuralabs.staging/auth/callback', 'http://localhost:4405/auth/callback']);
  assert.deepEqual(keycloakClientOf(product(), 'prod').redirectUris, ['https://acme-erp.nafuralabs.com/auth/callback']);
});

test('the lab finds its embedded PostgreSQL from the lock file of its data directory', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nafura-pg-'));
  assert.equal(postmasterPid(join(dir, 'postmaster.pid')), null);
  writeFileSync(join(dir, 'postmaster.pid'), '40164\r\nC:/data/postgres\r\n1791157892\r\n');
  assert.equal(postmasterPid(join(dir, 'postmaster.pid')), 40164);
  writeFileSync(join(dir, 'postmaster.pid'), 'garbage\n');
  assert.equal(postmasterPid(join(dir, 'postmaster.pid')), null);
});

test('Gradle caches live in the toolchain, whatever GRADLE_USER_HOME or ~/.gradle say', () => {
  assert.equal(gradleUserHome({ NAFURA_TOOLCHAIN: join('t', 'nf'), GRADLE_USER_HOME: '/custom/gradle' }), join('t', 'nf', 'gradle'));
});

test('the toolchain sits outside the repository: NAFURA_TOOLCHAIN, else LOCALAPPDATA on Windows, else ~/.nafura', () => {
  assert.equal(toolchainRoot({ NAFURA_TOOLCHAIN: 'D:\\nf', LOCALAPPDATA: 'C:\\x' }, 'win32'), 'D:\\nf');
  assert.equal(toolchainRoot({ LOCALAPPDATA: join('C:', 'Users', 'dev', 'AppData', 'Local') }, 'win32'), join('C:', 'Users', 'dev', 'AppData', 'Local', 'nafura'));
  assert.equal(toolchainRoot({ HOME: join('home', 'dev') }, 'linux'), join('home', 'dev', '.nafura'));
});

test('each tool is found at a fixed place for the pinned versions', () => {
  const versions = { 'jdk.release': 'jdk-25.0.4.1+1', 'node.version': '22.22.3' };
  const win = toolchainPaths('nf', versions, 'win32', 'x64');
  assert.equal(win.java, join('nf', 'jdk', 'jdk-25.0.4.1+1', 'bin', 'java.exe'));
  assert.equal(win.nodeExe, join('nf', 'node', 'node-v22.22.3-win-x64', 'node.exe'));
  assert.equal(win.npmCli, join('nf', 'node', 'node-v22.22.3-win-x64', 'node_modules', 'npm', 'bin', 'npm-cli.js'));
  const mac = toolchainPaths('nf', versions, 'darwin', 'arm64');
  assert.equal(mac.java, join('nf', 'jdk', 'jdk-25.0.4.1+1', 'Contents', 'Home', 'bin', 'java'));
  assert.equal(mac.nodeExe, join('nf', 'node', 'node-v22.22.3-darwin-arm64', 'bin', 'node'));
});

test('the lab database lives in the toolchain, one folder per product', () => {
  assert.equal(labDataDir(product(), 'nf'), join('nf', 'data', 'acme-erp', 'postgres'));
});
