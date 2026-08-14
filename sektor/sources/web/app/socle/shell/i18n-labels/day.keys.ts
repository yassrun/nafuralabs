/**
 * i18n keys for week-day short labels (Mon-Sun). Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR array at:
 *   web/app/applications/erp/pages/rh/planning-equipes/planning-equipes.page.ts → DAY_LABELS
 */

export type DayCode = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export const DAY_KEYS: Record<DayCode, string> = {
  MON: 'enum.day.mon',
  TUE: 'enum.day.tue',
  WED: 'enum.day.wed',
  THU: 'enum.day.thu',
  FRI: 'enum.day.fri',
  SAT: 'enum.day.sat',
  SUN: 'enum.day.sun',
};

/** Ordered Mon→Sun list of i18n keys (drop-in replacement for the legacy array). */
export const DAY_KEYS_ORDERED: readonly string[] = [
  DAY_KEYS.MON,
  DAY_KEYS.TUE,
  DAY_KEYS.WED,
  DAY_KEYS.THU,
  DAY_KEYS.FRI,
  DAY_KEYS.SAT,
  DAY_KEYS.SUN,
];
