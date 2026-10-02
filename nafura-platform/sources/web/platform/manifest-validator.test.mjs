import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { SANDBOX_MANIFEST } from '../../../../sandbox/sources/web/src/app/sandbox.manifest.ts';
import { PLATFORM_CAPABILITY_MANIFESTS } from './capability-catalog.ts';
import { validateNafuraManifests } from './manifest-validator.ts';

const readExample = (name) =>
  JSON.parse(readFileSync(new URL(`../../../../sandbox/${name}`, import.meta.url), 'utf8'));

function manifest(id, { provides = [], requires = [] } = {}) {
  return {
    apiVersion: 'nafura.io/v1',
    kind: 'capability',
    metadata: { id, version: '1.0.0', owner: 'test', lifecycle: 'experimental' },
    spec: { provides, requires },
  };
}

function businessContext(id, spec) {
  return {
    apiVersion: 'nafura.io/v1',
    kind: 'business-context',
    metadata: { id, version: '1.0.0', owner: 'test', lifecycle: 'experimental' },
    spec,
  };
}

function application(businessContexts) {
  return {
    apiVersion: 'nafura.io/v1',
    kind: 'application',
    metadata: { id: 'app.example', version: '1.0.0', owner: 'test', lifecycle: 'experimental' },
    spec: { businessContexts },
  };
}

const achats = (overrides = {}) =>
  businessContext('bc.achats', {
    routesPrefix: '/achats',
    permissions: [{ id: 'achats.commande.read' }],
    defaultRoles: [{ code: 'ACHETEUR', permissions: ['achats.commande.read'] }],
    navigation: [{ id: 'achats-home', label: 'Achats', route: '/achats' }],
    ...overrides,
  });

const codes = (manifests) => validateNafuraManifests(manifests).map((issue) => issue.code);

test('accepts compatible providers and missing optional capabilities', () => {
  const provider = manifest('cap.documents', {
    provides: [{ id: 'cap.documents', version: '1.2.0' }],
  });
  const app = manifest('app.example', {
    requires: [
      { id: 'cap.documents', version: '^1.0.0' },
      { id: 'cap.approval', version: '^1.0.0', optional: true },
    ],
  });

  assert.deepEqual(validateNafuraManifests([provider, app]), []);
  assert.deepEqual(validateNafuraManifests([SANDBOX_MANIFEST]), []);
});

test('rejects a missing required capability', () => {
  const app = manifest('app.example', {
    requires: [{ id: 'cap.documents', version: '^1.0.0' }],
  });

  assert.deepEqual(
    validateNafuraManifests([app]).map((issue) => issue.code),
    ['missing-required-capability'],
  );
});

test('rejects a capability from another major version', () => {
  const provider = manifest('cap.documents', {
    provides: [{ id: 'cap.documents', version: '2.0.0' }],
  });
  const app = manifest('app.example', {
    requires: [{ id: 'cap.documents', version: '^1.0.0' }],
  });

  assert.deepEqual(
    validateNafuraManifests([provider, app]).map((issue) => issue.code),
    ['incompatible-capability-version'],
  );
});

test('rejects duplicate manifest and capability identifiers', () => {
  const first = manifest('cap.documents', {
    provides: [{ id: 'cap.documents', version: '1.0.0' }],
  });
  const second = manifest('cap.documents', {
    provides: [{ id: 'cap.documents', version: '1.1.0' }],
  });

  assert.deepEqual(
    validateNafuraManifests([first, second]).map((issue) => issue.code),
    ['duplicate-manifest-id', 'duplicate-capability-provider'],
  );
});

test('rejects dependency cycles', () => {
  const first = manifest('cap.first', {
    provides: [{ id: 'cap.first', version: '1.0.0' }],
    requires: [{ id: 'cap.second', version: '^1.0.0' }],
  });
  const second = manifest('cap.second', {
    provides: [{ id: 'cap.second', version: '1.0.0' }],
    requires: [{ id: 'cap.first', version: '^1.0.0' }],
  });

  assert.deepEqual(
    validateNafuraManifests([first, second]).map((issue) => issue.code),
    ['dependency-cycle'],
  );
});

test('accepts the sandbox examples with the platform capability catalog', () => {
  const app = readExample('app.nafura.example.json');
  const bc = readExample('bc.manifest.example.json');

  assert.deepEqual(validateNafuraManifests([...PLATFORM_CAPABILITY_MANIFESTS, app, bc]), []);
  assert.deepEqual(validateNafuraManifests([...PLATFORM_CAPABILITY_MANIFESTS, SANDBOX_MANIFEST]), []);
});

test('accepts an application with a well-formed business context', () => {
  assert.deepEqual(codes([application(['bc.achats']), achats()]), []);
});

test('rejects an application referencing an unknown business context', () => {
  assert.deepEqual(codes([application(['bc.achats', 'bc.ventes']), achats()]), [
    'unknown-business-context',
  ]);
});

test('rejects business contexts sharing a route prefix', () => {
  const nested = businessContext('bc.commandes', { routesPrefix: '/achats/commandes/' });
  const same = businessContext('bc.appro', { routesPrefix: '/achats' });
  const lookalike = businessContext('bc.achatsx', { routesPrefix: '/achatsx' });

  assert.deepEqual(codes([achats(), nested]), ['route-prefix-collision']);
  assert.deepEqual(codes([achats(), same]), ['route-prefix-collision']);
  assert.deepEqual(codes([achats(), lookalike]), []);
});

test('rejects a permission outside the business context namespace', () => {
  const bc = achats({ permissions: [{ id: 'achats.commande.read' }, { id: 'ventes.devis.read' }] });

  assert.deepEqual(codes([bc]), ['permission-outside-namespace']);
});

test('rejects a default role granting an undeclared permission', () => {
  const bc = achats({
    defaultRoles: [{ code: 'ACHETEUR', permissions: ['achats.commande.read', 'achats.commande.write'] }],
  });

  assert.deepEqual(codes([bc]), ['role-unknown-permission']);
});

test('rejects navigation outside the business context prefix', () => {
  const outside = achats({ navigation: [{ id: 'x', label: 'X', route: '/ventes' }] });
  const lookalike = achats({ navigation: [{ id: 'x', label: 'X', route: '/achatsx' }] });
  const unprefixed = achats({ routesPrefix: undefined });

  assert.deepEqual(codes([outside]), ['navigation-outside-prefix']);
  assert.deepEqual(codes([lookalike]), ['navigation-outside-prefix']);
  assert.deepEqual(codes([unprefixed]), ['navigation-outside-prefix']);
});

test('navigation is a tree of links and groups guarded by declared permissions', () => {
  const tree = achats({
    navigation: [
      {
        id: 'commandes',
        label: 'Commandes',
        children: [
          { id: 'liste', label: 'Liste', route: '/achats/commandes', permission: 'achats.commande.read' },
          { id: 'hors', label: 'Hors', route: '/ventes' },
        ],
      },
    ],
  });
  const undeclared = achats({ navigation: [{ id: 'x', label: 'X', route: '/achats', permission: 'achats.facture.read' }] });
  const neither = achats({ navigation: [{ id: 'x', label: 'X' }] });
  const both = achats({ navigation: [{ id: 'x', label: 'X', route: '/achats', children: [{ id: 'y', label: 'Y', route: '/achats/y' }] }] });

  assert.deepEqual(codes([tree]), ['navigation-outside-prefix']);
  assert.deepEqual(codes([undeclared]), ['navigation-unknown-permission']);
  assert.deepEqual(codes([neither]), ['navigation-invalid-node']);
  assert.deepEqual(codes([both]), ['navigation-invalid-node']);
});

function applicationWithRoles(businessContexts, roles) {
  const app = application(businessContexts);
  return { ...app, spec: { ...app.spec, roles } };
}

const ventes = () =>
  businessContext('bc.ventes', {
    routesPrefix: '/ventes',
    permissions: [{ id: 'ventes.devis.read' }],
    defaultRoles: [{ code: 'VENDEUR', permissions: ['ventes.devis.read'] }],
  });

test('accepts a cross-BC role composed of embedded BC roles and permissions', () => {
  const app = applicationWithRoles(['bc.achats', 'bc.ventes'], [
    { code: 'COMMERCIAL', label: 'Commercial', includes: ['bc.achats:ACHETEUR', 'bc.ventes:VENDEUR'] },
    { code: 'LECTEUR', label: 'Lecteur', permissions: ['achats.commande.read', 'ventes.devis.read'] },
  ]);

  assert.deepEqual(codes([app, achats(), ventes()]), []);
});

test('rejects a role including a role of a business context the application does not embed', () => {
  const app = applicationWithRoles(['bc.achats'], [
    { code: 'COMMERCIAL', label: 'Commercial', includes: ['bc.ventes:VENDEUR', 'bc.achats:INCONNU'] },
  ]);

  assert.deepEqual(codes([app, achats(), ventes()]), ['role-unknown-reference', 'role-unknown-reference']);
});

test('rejects a role granting a permission no embedded business context declares', () => {
  const app = applicationWithRoles(['bc.achats'], [
    { code: 'LECTEUR', label: 'Lecteur', permissions: ['ventes.devis.read'] },
  ]);

  assert.deepEqual(codes([app, achats(), ventes()]), ['role-unknown-permission']);
});

test('rejects role codes declared twice across business contexts and the application', () => {
  const clash = businessContext('bc.ventes', {
    routesPrefix: '/ventes',
    permissions: [{ id: 'ventes.devis.read' }],
    defaultRoles: [{ code: 'ACHETEUR', permissions: ['ventes.devis.read'] }],
  });
  const app = applicationWithRoles(['bc.achats', 'bc.ventes'], [
    { code: 'ACHETEUR', label: 'Acheteur', includes: ['bc.achats:ACHETEUR'] },
  ]);

  assert.deepEqual(codes([app, achats(), clash]), ['duplicate-role-code', 'duplicate-role-code']);
});