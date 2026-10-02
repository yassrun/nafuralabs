import assert from 'node:assert/strict';
import test from 'node:test';

const { badgeOf, displayLabel, filterVisibleNodes, findActiveDomainId, findActiveLabel, groupByZone, resolveNavIcon } =
  await import('./sidebar-tree.ts');

const nodes = [
  { id: 'admin', label: 'Administration', zone: 'platform', order: 2, children: [{ id: 'roles', label: 'Rôles', route: '/administration/roles' }] },
  { id: 'home', label: 'Accueil', zone: 'workspace', route: '/dashboard' },
  { id: 'achats', label: 'Achats', zone: 'bc.achats', children: [
    { id: 'cmd', label: 'Commandes', children: [{ id: 'liste', label: 'Liste', route: '/achats/commandes' }] },
  ] },
  { id: 'settings', label: 'Paramètres', zone: 'platform', order: 1, children: [{ id: 'me', label: 'Moi', route: '/user-settings' }] },
];
const zones = [
  { id: 'workspace', label: '', order: 0 },
  { id: 'bc.achats', label: '', order: 1 },
  { id: 'platform', label: '', order: 2 },
];

test('zones follow their order, domains theirs; unknown zones go last', () => {
  const groups = groupByZone([...nodes, { id: 'x', label: 'X', zone: 'other', route: '/x' }], zones);
  assert.deepEqual(groups.map((group) => group.zone), ['workspace', 'bc.achats', 'platform', 'other']);
  assert.deepEqual(groups[2].nodes.map((node) => node.id), ['settings', 'admin']);
});

test('the active domain is the one holding the route, on a path boundary', () => {
  assert.equal(findActiveDomainId(nodes, '/achats/commandes/42?tab=1'), 'achats');
  assert.equal(findActiveDomainId(nodes, '/administration/roles'), 'admin');
  assert.equal(findActiveDomainId(nodes, '/dashboardx'), null);
  assert.equal(findActiveLabel(nodes, '/achats/commandes/42'), 'Liste');
});

test('hidden nodes and groups left empty are dropped', () => {
  const visible = filterVisibleNodes([
    { id: 'a', label: 'A', children: [{ id: 'b', label: 'B', route: '/b', visible: false }] },
    { id: 'c', label: 'C', route: '/c' },
  ]);
  assert.deepEqual(visible.map((node) => node.id), ['c']);
});

test('badges: providers are called, zero hidden on request', () => {
  assert.equal(badgeOf({ id: 'a', label: 'A' }), null);
  assert.deepEqual(badgeOf({ id: 'a', label: 'A', badge: () => ({ value: 3, variant: 'info' }) }), { value: 3, variant: 'info' });
  assert.equal(badgeOf({ id: 'a', label: 'A', badge: { value: 0, variant: 'info', hideWhenZero: true } }), null);
});

test('labels: keys are translated or humanized, display text is kept as written', () => {
  const translate = (key) => (key === 'erp.nav.achats' ? 'Achats' : key);
  assert.equal(displayLabel('erp.nav.achats', translate), 'Achats');
  assert.equal(displayLabel('erp.nav.bonsDeCommande', translate), 'Bons De Commande');
  assert.equal(displayLabel('Journal d’audit', translate), 'Journal d’audit');
  assert.equal(displayLabel('Tâches planifiées', translate), 'Tâches planifiées');
});

test('icons: aliases and Material-style names map to Lucide', () => {
  assert.equal(resolveNavIcon('alert_triangle'), 'triangle-alert');
  assert.equal(resolveNavIcon('flask-conical'), 'flask-conical');
  assert.equal(resolveNavIcon({ component: {} }), '');
});
