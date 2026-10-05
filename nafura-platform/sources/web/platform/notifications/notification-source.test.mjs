import assert from 'node:assert/strict';
import test from 'node:test';

import { notificationSourceLabel } from './notification-source.ts';

test('known sources keep a French label', () => {
  assert.equal(notificationSourceLabel('platform.approval.requested'), 'Approbation à donner');
  assert.equal(notificationSourceLabel('demo.purchasing.request.approved'), 'Demande d’achat approuvée');
});

test('unknown sources humanize the leaf', () => {
  assert.equal(notificationSourceLabel('demo.custom.event_name'), 'Event Name');
  assert.equal(notificationSourceLabel(null), '');
});
