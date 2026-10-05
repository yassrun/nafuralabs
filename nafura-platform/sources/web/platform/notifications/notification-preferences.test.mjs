import assert from 'node:assert/strict';
import test from 'node:test';

import { channelEnabled, channelLocked } from './notification-preferences.ts';

const approved = {
  event: 'demo.request.approved',
  label: 'Approuvée',
  mandatory: false,
  organisation: ['in_app'],
  channels: ['in_app'],
};

const mandatory = {
  event: 'platform.approval.requested',
  label: 'À approuver',
  mandatory: true,
  organisation: ['in_app', 'email'],
  channels: ['in_app', 'email'],
};

test('the user cannot add a channel the organisation dropped', () => {
  assert.equal(channelEnabled(approved, 'in_app'), true);
  assert.equal(channelLocked(approved, 'user', 'in_app'), false);
  assert.equal(channelEnabled(approved, 'email'), false);
  assert.equal(channelLocked(approved, 'user', 'email'), true);
});

test('a mandatory event stays locked for the user', () => {
  assert.equal(channelLocked(mandatory, 'user', 'email'), true);
  assert.equal(channelLocked(mandatory, 'organisation', 'email'), false);
});
