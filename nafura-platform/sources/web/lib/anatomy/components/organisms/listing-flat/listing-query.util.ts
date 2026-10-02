import type { FilterClause, FilterGroup, FilterNode, FilterOperator } from '../../../types';
import { isFilterGroup } from '../../../types';
import type { NfTreeNode } from '../tree-table';

function fieldValue(item: unknown, key: string): unknown {
  if (item == null || typeof item !== 'object') return undefined;
  return (item as Record<string, unknown>)[key];
}

function isBlankFilterValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isEmptyFieldValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function eqComparable(actual: unknown, expected: unknown): boolean {
  return String(actual ?? '') === String(expected ?? '');
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function coerceDateMs(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

function compareOrdered(actual: unknown, expected: unknown): number {
  const na = coerceNumber(actual);
  const nb = coerceNumber(expected);
  if (na !== null && nb !== null) return na - nb;

  const da = coerceDateMs(actual);
  const db = coerceDateMs(expected);
  if (da !== null && db !== null) return da - db;

  return String(actual ?? '').localeCompare(String(expected ?? ''), undefined, { numeric: true });
}

function normalizeInValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map((s) => s.trim()).filter((s) => s !== '');
  }
  return [value];
}

function readBetweenBounds(value: unknown): [unknown, unknown] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  return [value[0], value[1]];
}

/**
 * Evaluates a single filter clause against an item (local listing mode).
 */
export function matchesFilterClause(item: unknown, clause: FilterClause): boolean {
  const actual = fieldValue(item, clause.field);
  const { op, value } = clause;

  switch (op) {
    case 'eq':
      return eqComparable(actual, value);
    case 'ne':
      return !eqComparable(actual, value);
    case 'contains':
      return String(actual ?? '')
        .toLowerCase()
        .includes(String(value ?? '').toLowerCase());
    case 'startsWith':
      return String(actual ?? '')
        .toLowerCase()
        .startsWith(String(value ?? '').toLowerCase());
    case 'gt':
      return compareOrdered(actual, value) > 0;
    case 'gte':
      return compareOrdered(actual, value) >= 0;
    case 'lt':
      return compareOrdered(actual, value) < 0;
    case 'lte':
      return compareOrdered(actual, value) <= 0;
    case 'in':
      return normalizeInValues(value).some((candidate) => eqComparable(actual, candidate));
    case 'between': {
      const bounds = readBetweenBounds(value);
      if (!bounds) return false;
      const [from, to] = bounds;
      const cmpFrom = compareOrdered(actual, from);
      const cmpTo = compareOrdered(actual, to);
      return cmpFrom >= 0 && cmpTo <= 0;
    }
    case 'isEmpty':
      return isEmptyFieldValue(actual);
    case 'isNotEmpty':
      return !isEmptyFieldValue(actual);
    default:
      return true;
  }
}

/**
 * AND-combines filter clauses (V1 listing query semantics).
 */
export function matchesFilterClauses(item: unknown, clauses: FilterClause[]): boolean {
  for (const clause of clauses) {
    if (!matchesFilterClause(item, clause)) return false;
  }
  return true;
}

function matchesFilterNode(item: unknown, node: FilterNode): boolean {
  if (isFilterGroup(node)) return matchesFilterGroup(item, node);
  return matchesFilterClause(item, node);
}

/** Evaluate a Notion-style filter group (AND / OR, nested). */
export function matchesFilterGroup(item: unknown, group: FilterGroup | undefined | null): boolean {
  if (!group || group.children.length === 0) return true;
  if (group.combinator === 'or') {
    return group.children.some((child) => matchesFilterNode(item, child));
  }
  return group.children.every((child) => matchesFilterNode(item, child));
}

/**
 * Legacy `Record` filters → implicit `eq` clauses (sandbox / toolbar compat).
 */
export function recordFiltersToClauses(filters: Record<string, unknown>): FilterClause[] {
  const clauses: FilterClause[] = [];
  for (const [field, value] of Object.entries(filters)) {
    if (isBlankFilterValue(value)) continue;
    clauses.push({ field, op: 'eq', value });
  }
  return clauses;
}

/** Builds a single eq clause (helper for adapters). */
export function eqClause(field: string, value: unknown): FilterClause {
  return { field, op: 'eq', value };
}

/** Builds a clause with an explicit operator. */
export function filterClause(field: string, op: FilterOperator, value?: unknown): FilterClause {
  return { field, op, value };
}

export function matchesSearch(item: unknown, query: string, fields?: string[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (fields?.length) {
    return fields.some((f) => String(fieldValue(item, f) ?? '').toLowerCase().includes(q));
  }
  return JSON.stringify(item).toLowerCase().includes(q);
}

/**
 * Returns true when the item matches all active filters.
 * `Record` values use strict string equality (`eq`) — same behavior as pre–Phase A.
 */
export function matchesFilters(item: unknown, filters: Record<string, unknown>): boolean {
  return matchesFilterClauses(item, recordFiltersToClauses(filters));
}

/** Segment filters: each field equals the value (or one of the values of an array). */
export function matchesSegment(item: unknown, filters: Record<string, unknown> | undefined): boolean {
  if (!filters) return true;
  return Object.entries(filters).every(([field, expected]) => {
    const actual = fieldValue(item, field);
    return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
  });
}

/** Keep matching nodes and ancestors. A match keeps the whole subtree. */
export function filterTreeNodes<T>(
  nodes: NfTreeNode<T>[],
  pred: (data: T) => boolean
): NfTreeNode<T>[] {
  const out: NfTreeNode<T>[] = [];
  for (const node of nodes) {
    if (pred(node.data)) {
      out.push(node);
      continue;
    }
    const children = node.children?.length ? filterTreeNodes(node.children, pred) : [];
    if (children.length) {
      out.push({ ...node, children });
    }
  }
  return out;
}

export function collectExpandableKeys<T>(nodes: NfTreeNode<T>[]): Set<string> {
  const keys = new Set<string>();
  const walk = (xs: NfTreeNode<T>[]) => {
    for (const n of xs) {
      if (n.children?.length && !n.leaf) {
        keys.add(n.key);
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return keys;
}
