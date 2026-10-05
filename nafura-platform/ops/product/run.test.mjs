import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { hostOf, imageOf, keycloakClientOf, namespaceOf, oidcOf, ownersOf, postmasterPid, renderKustomization } from './run.mjs';

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
