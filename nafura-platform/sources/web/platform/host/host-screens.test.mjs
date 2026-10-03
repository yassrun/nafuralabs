import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const catalog = JSON.parse(readFileSync(new URL('../../../../capabilities.json', import.meta.url), 'utf8'));
const catalogIds = new Set(catalog.capabilities.map((capability) => capability.id));
const source = readFileSync(new URL('./host-screens.ts', import.meta.url), 'utf8');
const screenCapabilities = [...source.matchAll(/capability: '([^']+)'/g)].map((match) => match[1]);
const adminSections = [...source.matchAll(/section: '([^']+)'/g)].map((match) => match[1]);
const typesSource = readFileSync(new URL('../../core/shell/platform-app-shell.types.ts', import.meta.url), 'utf8');
const sectionBlock = typesSource.match(/interface AdministrationSectionConfig \{([\s\S]*?)\n\}/)[1];
const declaredSections = [...sectionBlock.matchAll(/^\s+(\w+)\?:/gm)].map((match) => match[1]);

test('every screen belongs to a catalog capability', () => {
  assert.ok(screenCapabilities.length > 10, 'screens parsed');
  assert.deepEqual(screenCapabilities.filter((id) => !catalogIds.has(id)), []);
});

test('every administration section is mounted exactly once', () => {
  assert.deepEqual([...adminSections].sort(), [...declaredSections].sort());
});

test('every catalog capability with a UI has a screen', () => {
  const withScreen = new Set(screenCapabilities);
  const apiOnly = ['cap.lab', 'cap.tagging', 'cap.comments', 'cap.jobs', 'cap.geo', 'cap.usage'];
  assert.deepEqual(
    [...catalogIds].filter((id) => !withScreen.has(id) && !apiOnly.includes(id)),
    [],
    'capability without screen: add it to host-screens.ts or to apiOnly',
  );
});

test('host screens import no capability code eagerly: a disabled capability stays out of the bundle', () => {
  const eager = [...source.matchAll(/^import (?!type )[^;]+from '([^']+)';/gm)].map((match) => match[1]);
  assert.deepEqual(eager, []);
});

// Same closure as host-tests: a capability goes with every capability requiring it.
function withDependents(id) {
  const removed = new Set([id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const capability of catalog.capabilities) {
      if (!removed.has(capability.id) && (capability.requires ?? []).some((required) => removed.has(required))) {
        removed.add(capability.id);
        grew = true;
      }
    }
  }
  return removed;
}

const { hostScreens, HOST_ADMINISTRATION_SCREENS, HOST_TOP_LEVEL_SCREENS } = await import('./host-screens.ts');
const all = catalog.capabilities.map((capability) => capability.id);
const everything = hostScreens(all);

for (const capability of catalog.capabilities.filter((c) => !c.core)) {
  test(`web without ${capability.id}: no route, navigation or administration section of it remains`, () => {
    const removed = withDependents(capability.id);
    const screens = hostScreens(all.filter((id) => !removed.has(id)));
    const gone = (list) => list.filter((screen) => removed.has(screen.capability));

    const routes = new Set(screens.routes.map((route) => route.path));
    const flatten = (items) => items.flatMap((item) => [item.route, ...flatten(item.children ?? [])]);
    const navigation = new Set(screens.navigation.flatMap((section) => flatten(section.items)));
    for (const screen of gone(HOST_TOP_LEVEL_SCREENS)) {
      assert.ok(!routes.has(screen.path), `route /${screen.path}`);
      assert.ok(!navigation.has('/' + screen.path), `nav /${screen.path}`);
    }
    for (const screen of gone(HOST_ADMINISTRATION_SCREENS)) {
      assert.equal(screens.administrationSections[screen.section]?.enabled, false, `section ${screen.section}`);
      assert.ok(!navigation.has('/administration/' + screen.path), `nav /administration/${screen.path}`);
    }
    // Everything else is still there.
    const kept = (list) => list.filter((screen) => !removed.has(screen.capability));
    for (const screen of kept(HOST_TOP_LEVEL_SCREENS)) assert.ok(routes.has(screen.path), `kept /${screen.path}`);
    for (const screen of kept(HOST_ADMINISTRATION_SCREENS)) {
      assert.equal(screens.administrationSections[screen.section]?.enabled, true, `kept section ${screen.section}`);
    }
  });
}

test('with everything enabled, every screen is mounted', () => {
  const routes = new Set(everything.routes.map((route) => route.path));
  for (const screen of HOST_TOP_LEVEL_SCREENS) assert.ok(routes.has(screen.path), screen.path);
  assert.ok(routes.has('administration'));
});

test('roles stay without cap.iam (core), and spec.customRoles: false keeps organizations to the declared roles', () => {
  const withoutMembers = hostScreens(all.filter((id) => id !== 'cap.iam'));
  assert.equal(withoutMembers.administrationSections.roles.enabled, true);
  assert.equal(withoutMembers.administrationSections.members.enabled, false);
  assert.equal(everything.administrationSections.roles.customRoles, true);
  assert.equal(hostScreens(all, { customRoles: false }).administrationSections.roles.customRoles, false);
});

// Permissions the backend enforces (shared with the listing guard).
import { backendPermissions } from './backend-permissions.mjs';

test('every navigation permission is one the backend enforces', () => {
  const enforced = backendPermissions();
  assert.ok(enforced.size > 20, 'backend permissions parsed');
  const declared = [...HOST_TOP_LEVEL_SCREENS, ...HOST_ADMINISTRATION_SCREENS]
    .map((screen) => screen.nav.permission)
    .filter(Boolean);
  assert.ok(declared.length > 10, 'navigation permissions declared');
  assert.deepEqual(declared.filter((permission) => !enforced.has(permission)), []);
});

test('every route guard permission of platform screens is one the backend enforces', () => {
  const enforced = backendPermissions();
  const web = fileURLToPath(new URL('../../', import.meta.url));
  const unknown = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.routes.ts')) {
        const source = readFileSync(full, 'utf8');
        for (const block of source.matchAll(/permissions(Any)?:\s*\[([^\]]*)\]/g)) {
          const values = [...block[2].matchAll(/'([^']+)'/g)].map((m) => m[1]);
          // permissionsAny passes when one value is real; permissions needs all of them.
          const bad = block[1] ? (values.some((v) => enforced.has(v)) ? [] : values) : values.filter((v) => !enforced.has(v));
          bad.forEach((v) => unknown.push(`${v} (${full.slice(web.length)})`));
        }
      }
    }
  };
  ['features', 'app'].forEach((dir) => walk(join(web, dir)));
  assert.deepEqual(unknown, [], 'a guard on a permission no backend endpoint checks can never be granted');
});
