import assert from 'node:assert/strict';
import test from 'node:test';

const { describeCron } = await import('./cron-label.ts');

test('common Spring cron schedules read as French sentences', () => {
  assert.equal(describeCron('0 0 8 * * *'), 'Tous les jours à 08:00');
  assert.equal(describeCron('0 30 1 * * *'), 'Tous les jours à 01:30');
  assert.equal(describeCron('0 0 2 * * SUN'), 'Chaque dimanche à 02:00');
  assert.equal(describeCron('0 0 3 1 * *'), 'Le 1er de chaque mois à 03:00');
  assert.equal(describeCron('0 0 3 15 * *'), 'Le 15 de chaque mois à 03:00');
});

test('other expressions stay as written', () => {
  assert.equal(describeCron('0 */5 * * * *'), '0 */5 * * * *');
  assert.equal(describeCron('0 0 9 * * MON-FRI'), '0 0 9 * * MON-FRI');
  assert.equal(describeCron(null), '');
});
