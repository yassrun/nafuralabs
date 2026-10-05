import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { planHost, readApplicationManifest } from './host-plan.ts';

const catalog = JSON.parse(readFileSync(new URL('../../../../capabilities.json', import.meta.url), 'utf8'));
const allIds = catalog.capabilities.map((capability) => capability.id);

function application(disabled) {
  return {
    apiVersion: 'nafura.io/v1',
    kind: 'application',
    metadata: { id: 'app.host', version: '0.1.0', owner: 'test', lifecycle: 'experimental' },
    spec: {
      product: { name: 'Host' },
      runtime: { defaultRoute: '/' },
      businessContexts: [],
      ...(disabled ? { capabilities: { disabled } } : {}),
    },
  };
}

function businessContext(requires) {
  return {
    apiVersion: 'nafura.io/v1',
    kind: 'business-context',
    metadata: { id: 'bc.achats', version: '0.1.0', owner: 'test', lifecycle: 'experimental' },
    spec: { routesPrefix: '/achats', permissions: [], requires },
  };
}

test('reads an application manifest and rejects anything else', () => {
  const app = application();
  assert.equal(readApplicationManifest(app), app);
  assert.throws(() => readApplicationManifest({ ...app, kind: 'capability' }), /kind "application"/);
  assert.throws(() => readApplicationManifest(null), /kind "application"/);
  assert.throws(() => readApplicationManifest({ ...app, spec: {} }), /no spec\.runtime/);
  assert.equal(
    readApplicationManifest({ ...app, spec: { ...app.spec, runtime: { tenancy: 'multi', signup: 'operator', defaultRoute: '/' } } }).spec.runtime.tenancy,
    'multi',
  );
});

test('embeds every catalog capability by default', () => {
  assert.deepEqual(planHost(application(), [], catalog).capabilities, allIds);
  assert.deepEqual(planHost(application([]), [], catalog).capabilities, allIds);
});

test('removes only the disabled capabilities', () => {
  const plan = planHost(application(['cap.geo', 'cap.tagging']), [], catalog);

  assert.deepEqual(plan.capabilities, allIds.filter((id) => id !== 'cap.geo' && id !== 'cap.tagging'));
});

test('rejects unknown and core capabilities', () => {
  assert.throws(() => planHost(application(['cap.nope']), [], catalog), /unknown capability "cap\.nope"/);
  assert.throws(() => planHost(application(['cap.lab']), [], catalog), /core capability "cap\.lab"/);
});

test('rejects disabling a capability another enabled one requires', () => {
  assert.throws(
    () => planHost(application(['cap.approvals']), [], catalog),
    /disables "cap\.approvals", required by capability "cap\.(notifications|webhooks|ai)"/,
  );
  assert.doesNotThrow(() =>
    planHost(application(['cap.document-extraction', 'cap.usage', 'cap.ai', 'cap.webhooks']), [], catalog),
  );
});

test('rejects disabling a capability a business context requires, unless optional', () => {
  const required = businessContext([{ id: 'cap.tagging', version: '^0.1.0' }]);
  const optional = businessContext([{ id: 'cap.tagging', version: '^0.1.0', optional: true }]);

  assert.throws(
    () => planHost(application(['cap.tagging']), [required], catalog),
    /required by business context "bc\.achats"/,
  );
  assert.doesNotThrow(() => planHost(application(['cap.tagging']), [optional], catalog));
});
