import type { FilterClause, ListingQueryState, ListingSegment } from '../../../lib/anatomy/types';
import { flattenAndClauses, resolveFilterGroup } from '../../../lib/anatomy/components/organisms/listing-flat/listing-query-state.util';

/**
 * Query string of a server-paged list. Page is 0-based (Spring). Only equality filters are sent:
 * the active segment and `eq` clauses. Ranges and « contains » stay client-side.
 */
export function serverQueryParams(
  query: ListingQueryState,
  options: {
    fixed?: Record<string, string | undefined>;
    segments?: ListingSegment[];
    extra?: Record<string, string | undefined>;
  } = {},
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(options.fixed ?? {})) {
    if (value != null && value !== '') params[key] = value;
  }
  params['page'] = String(Math.max(0, (query.page ?? 1) - 1));
  params['size'] = String(query.pageSize || 25);
  const search = query.search?.trim();
  if (search) params['q'] = search;
  const sorts = (query.sort ?? []).filter((s) => s?.field && (s.direction === 'asc' || s.direction === 'desc'));
  if (sorts.length) {
    // Colon avoids Spring splitting `field,asc` into two list entries.
    params['sort'] = `${sorts[0].field}:${sorts[0].direction}`;
  }
  const segmentId = query.segment;
  const segment = (options.segments ?? []).find((item) => item.id === segmentId) ?? (options.segments ?? [])[0];
  writeEquality(params, segment?.filters);
  for (const clause of flattenAndClauses(resolveFilterGroup(query))) {
    writeClause(params, clause);
  }
  for (const [key, value] of Object.entries(options.extra ?? {})) {
    if (value != null && value !== '') params[key] = value;
  }
  return params;
}

function writeEquality(params: Record<string, string>, filters?: Record<string, unknown>): void {
  if (!filters) return;
  for (const [field, value] of Object.entries(filters)) {
    if (value == null || value === '' || Array.isArray(value)) continue;
    params[field] = String(value);
  }
}

function writeClause(params: Record<string, string>, clause: FilterClause): void {
  if (clause.op !== 'eq' || clause.value == null || clause.value === '' || Array.isArray(clause.value)) return;
  params[clause.field] = String(clause.value);
}
