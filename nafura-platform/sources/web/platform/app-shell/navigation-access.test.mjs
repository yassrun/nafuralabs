import assert from 'node:assert/strict';
import test from 'node:test';

const { grants, toSidebar, visibleNavigation } = await import('./navigation-access.ts');

const sections = [
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { id: 'roles', label: 'Rôles', route: '/administration/roles', permission: 'tenant.roles.read' },
      { id: 'audit', label: 'Audit', route: '/administration/audit', permission: 'administration.audit.log.read' },
    ],
  },
  { id: 'demo', label: 'Démo', items: [{ id: 'notes', label: 'Notes', route: '/demo/notes', permission: 'demo.notes.note.read' }] },
  { id: 'settings', label: 'Paramètres', items: [{ id: 'me', label: 'Mes paramètres', route: '/user-settings' }] },
];
const ids = (result) => result.flatMap((section) => section.items.map((item) => item.id));

test('grants mirrors the backend wildcard rules', () => {
  const permissions = new Set(['demo.notes.note.read', 'administration.*']);
  assert.ok(grants(permissions, 'demo.notes.note.read'));
  assert.ok(grants(permissions, 'administration.audit.read'));
  assert.ok(!grants(permissions, 'administrationx.audit.read'));
  assert.ok(!grants(permissions, 'demo.notes.note.create'));
  assert.ok(grants(new Set(['*']), 'anything.at.all'));
});

test('keeps only permitted items and drops emptied sections', () => {
  const result = visibleNavigation(sections, { permissions: new Set(['demo.notes.note.read']) });
  assert.deepEqual(ids(result), ['notes', 'me']);
  assert.deepEqual(result.map((section) => section.id), ['demo', 'settings']);
});

test('super admin sees everything', () => {
  assert.deepEqual(ids(visibleNavigation(sections, { permissions: new Set(['*']) })), ['roles', 'audit', 'notes', 'me']);
});

test('while permissions load, guarded items stay hidden', () => {
  assert.deepEqual(ids(visibleNavigation(sections, { permissions: null })), ['me']);
});

const tree = [
  {
    id: 'bc.demo',
    items: [
      {
        id: 'bc.demo',
        label: 'Démo',
        domain: 'demo',
        children: [
          { id: 'notes', label: 'Notes', route: '/demo/notes', permission: 'demo.notes.note.read' },
          { id: 'archive', label: 'Archives', children: [{ id: 'old', label: 'Anciennes', route: '/demo/old', permission: 'demo.notes.note.delete' }] },
          { id: 'help', label: 'Aide', route: '/demo/help' },
        ],
      },
    ],
  },
];
const leaves = (items) => items.flatMap((item) => (item.children?.length ? leaves(item.children) : [item.id]));
const visibleLeaves = (access) => visibleNavigation(tree, access).flatMap((section) => leaves(section.items));

test('groups keep their permitted entries and vanish when none is left', () => {
  assert.deepEqual(visibleLeaves({ permissions: new Set(['demo.notes.note.read']) }), ['notes', 'help']);
  assert.deepEqual(visibleLeaves({ permissions: new Set(['*']) }), ['notes', 'old', 'help']);
  const empty = [{ id: 's', items: [{ id: 'g', label: 'G', children: [{ id: 'x', label: 'X', route: '/x', permission: 'a.b.c.read' }] }] }];
  assert.deepEqual(visibleNavigation(empty, { permissions: new Set() }), []);
});

test('a disabled domain hides its business context, even for a super admin', () => {
  const access = { permissions: new Set(['*']), disabledDomains: new Set(['demo']) };
  assert.deepEqual(visibleNavigation(tree, access), []);
  const platform = [{ id: 'p', items: [{ id: 'x', label: 'X', route: '/x', permission: 'demo.notes.note.read' }] }];
  assert.deepEqual(visibleNavigation(platform, access), [], 'its permissions are refused anywhere');
});

test('sections become ordered zones, entries their domains', () => {
  const { nodes, zones } = toSidebar([...tree, ...sections]);
  assert.deepEqual(zones.map((zone) => [zone.id, zone.order]), [['bc.demo', 0], ['admin', 1], ['demo', 2], ['settings', 3]]);
  assert.equal(nodes[0].zone, 'bc.demo');
  assert.deepEqual(nodes[0].children.map((child) => child.id), ['notes', 'archive', 'help']);
  assert.equal(nodes[0].children[1].children[0].route, '/demo/old');
});
