import assert from 'node:assert/strict';
import test from 'node:test';

const { formatRelativeTime } = await import('./relative-time.ts');
const now = new Date('2026-10-01T12:00:00Z');
const ago = (ms) => new Date(now.getTime() - ms).toISOString();

test('relative time is French', () => {
  assert.equal(formatRelativeTime(ago(10_000), 'fr', now), 'maintenant');
  assert.equal(formatRelativeTime(ago(5 * 60_000), 'fr', now), 'il y a 5 minutes');
  assert.equal(formatRelativeTime(ago(3 * 3_600_000), 'fr', now), 'il y a 3 heures');
  assert.equal(formatRelativeTime(ago(24 * 3_600_000), 'fr', now), 'hier');
  assert.match(formatRelativeTime(ago(30 * 24 * 3_600_000), 'fr', now), /^1 sept\.?$/);
  assert.equal(formatRelativeTime(null, 'fr', now), '');
  assert.equal(formatRelativeTime('not a date', 'fr', now), '');
});
