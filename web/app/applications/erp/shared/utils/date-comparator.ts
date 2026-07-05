/**
 * DateComparator — pure date utility functions.
 *
 * Centralises all timestamp arithmetic so callers never need `.getTime()`.
 * Works with `Date` objects and ISO-8601 date strings interchangeably.
 */

type DateInput = Date | string;

function toMs(d: DateInput): number {
  return typeof d === 'string' ? new Date(d).getTime() : d.getTime();
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Number of whole days between two dates (absolute value).
 * E.g. daysBetween('2024-01-01', '2024-01-04') === 3
 */
export function daysBetween(date1: DateInput, date2: DateInput): number {
  return Math.abs(toMs(date2) - toMs(date1)) / MS_PER_DAY;
}

/** Returns true when d1 is strictly before d2. */
export function isDateBefore(d1: DateInput, d2: DateInput): boolean {
  return toMs(d1) < toMs(d2);
}

/** Returns true when d1 is strictly after d2. */
export function isDateAfter(d1: DateInput, d2: DateInput): boolean {
  return toMs(d1) > toMs(d2);
}

/** Returns true when d falls within [start, end] (inclusive on both ends). */
export function isWithinRange(d: DateInput, start: DateInput, end: DateInput): boolean {
  const ms = toMs(d);
  return ms >= toMs(start) && ms <= toMs(end);
}

/**
 * Comparator for Array.sort() — ascending chronological order.
 * E.g. dates.sort(compareAsc)
 */
export function compareAsc(a: DateInput, b: DateInput): number {
  return toMs(a) - toMs(b);
}

/**
 * Returns the numeric timestamp (ms since epoch) for a date.
 * Replaces direct `.getTime()` calls where raw ms arithmetic is needed.
 */
export function toTimestamp(d: DateInput): number {
  return toMs(d);
}
