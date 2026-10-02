import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { projectApplicationConfig, projectAppShellConfig } from './manifest-projection.ts';

const readExample = (name) =>
  JSON.parse(readFileSync(new URL(`../../../../sandbox/${name}`, import.meta.url), 'utf8'));

const app = readExample('app.nafura.example.json');
const bc = readExample('bc.manifest.example.json');
const adminNavigation = [{ id: 'admin', items: [{ id: 'members', label: 'Membres', route: '/administration/members' }] }];

const achatsItems = [{ id: 'achats-home', label: 'Accueil', route: '/achats', icon: 'shopping-cart', permission: 'achats.commande.read' }];

test('projects runtime to the config the sandbox registers today', () => {
  assert.deepEqual(projectApplicationConfig(app), {
    applicationId: 'anatomy-sandbox',
    defaultRoute: '/',
    requiresTenant: false,
  });
});

test('projects shell to the provideAppShell config the sandbox passes today', () => {
  const config = projectAppShellConfig(app, [bc], adminNavigation);

  assert.deepEqual(config.product, { name: 'Anatomy', tagline: 'Platform lab' });
  assert.deepEqual(config.topBar, { enabled: true, pageContext: true });
  assert.deepEqual(config.userMenu, { enabled: true, userSettings: true });
  assert.deepEqual(config.tenantMenu, {
    enabled: true,
    tenantSettings: true,
    tenantSettingsRoute: '/organization/settings',
    organizationIdentity: true,
    organizationIdentityRoute: '/organization/identity',
    fallbackName: 'Sandbox',
    fallbackKey: 'sandbox',
  });
  assert.deepEqual(config.notifications, { enabled: true });
  assert.deepEqual(config.ai, { enabled: true });
});

test('each business context is one sidebar group between workspace and platform navigation', () => {
  const workspace = [{ id: 'workspace', items: [{ id: 'dashboard', label: 'Accueil', route: '/dashboard' }] }];
  const config = projectAppShellConfig(app, [bc], adminNavigation, workspace);

  assert.deepEqual(config.sidebar.navigation, [
    ...workspace,
    {
      id: 'bc.achats',
      items: [{ id: 'bc.achats', label: 'Achats', icon: 'shopping-cart', domain: 'achats', children: achatsItems }],
    },
    ...adminNavigation,
  ]);
});

test('business context navigation keeps its tree', () => {
  const tree = {
    ...bc,
    spec: {
      ...bc.spec,
      navigation: [
        { id: 'commandes', label: 'Commandes', children: [{ id: 'liste', label: 'Liste', route: '/achats/commandes', exactMatch: true }] },
      ],
    },
  };
  const [group] = projectAppShellConfig(app, [tree]).sidebar.navigation[0].items;

  assert.deepEqual(group.children, [
    { id: 'commandes', label: 'Commandes', children: [{ id: 'liste', label: 'Liste', route: '/achats/commandes', exactMatch: true }] },
  ]);
});

test('follows the application order of business contexts, not the input order', () => {
  const ventes = {
    ...bc,
    metadata: { ...bc.metadata, id: 'bc.ventes' },
    spec: { label: 'Ventes', routesPrefix: '/ventes', permissions: [] },
  };
  const ordered = { ...app, spec: { ...app.spec, businessContexts: ['bc.ventes', 'bc.achats'] } };

  const groups = projectAppShellConfig(ordered, [bc, ventes]).sidebar.navigation;
  assert.deepEqual(groups.map((section) => section.id), ['bc.ventes', 'bc.achats']);
});

test('fails fast on a missing runtime or business context', () => {
  const { runtime: _runtime, ...specWithoutRuntime } = app.spec;
  assert.throws(() => projectApplicationConfig({ ...app, spec: specWithoutRuntime }), /no spec\.runtime/);
  assert.throws(() => projectAppShellConfig(app, []), /unknown business context "bc\.achats"/);
});
