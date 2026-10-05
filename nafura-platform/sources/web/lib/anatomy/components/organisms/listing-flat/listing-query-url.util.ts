import type {
  FilterClause,
  FilterGroup,
  FilterOperator,
  ListingQueryState,
  ListingScope,
} from '../../../types';
import { isFilterGroup } from '../../../types';
import {
  clausesToGroup,
  createDefaultListingQuery,
  isFlatAndGroup,
  withSyncedFilters,
} from './listing-query-state.util';

const FILTER_OPS: FilterOperator[] = [
  'eq',
  'ne',
  'contains',
  'startsWith',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'between',
  'isEmpty',
  'isNotEmpty',
];

function encodeFilterValue(op: FilterOperator, value: unknown): string {
  if (op === 'isEmpty' || op === 'isNotEmpty') return '';
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? '')).join(',');
  }
  return String(value);
}

export function filterClauseToParam(clause: FilterClause): string {
  const valuePart = encodeFilterValue(clause.op, clause.value);
  if (valuePart === '' && (clause.op === 'isEmpty' || clause.op === 'isNotEmpty')) {
    return `${clause.field}:${clause.op}`;
  }
  return `${clause.field}:${clause.op}:${valuePart}`;
}

function parseFilterParam(raw: string): FilterClause | null {
  const parts = raw.split(':');
  if (parts.length < 2) return null;
  const field = parts[0];
  const op = parts[1] as FilterOperator;
  if (!FILTER_OPS.includes(op)) return null;
  if (op === 'isEmpty' || op === 'isNotEmpty') {
    return { field, op };
  }
  const valueRaw = parts.slice(2).join(':');
  if (valueRaw === '') return null;
  if (op === 'in' || op === 'between') {
    const values = valueRaw.split(',').map((s) => s.trim()).filter((s) => s !== '');
    return { field, op, value: op === 'between' ? values.slice(0, 2) : values };
  }
  return { field, op, value: valueRaw };
}

function parseFilterGroupJson(raw: string): FilterGroup | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!isFilterGroup(parsed as FilterGroup)) return null;
    return parsed as FilterGroup;
  } catch {
    return null;
  }
}

export function listingQueryToParams(query: ListingQueryState): Record<string, string | string[]> {
  const synced = withSyncedFilters(query);
  const params: Record<string, string | string[]> = {};
  const search = synced.search?.trim();
  if (search) params['search'] = search;
  params['page'] = String(synced.page);
  params['size'] = String(synced.pageSize);
  if (synced.sort?.field && synced.sort.direction) {
    params['sort'] = `${synced.sort.field},${synced.sort.direction}`;
  }
  if (synced.scope && synced.scope !== 'all') {
    params['scope'] = synced.scope;
  }
  if (synced.segment) params['segment'] = synced.segment;
  if (synced.presets?.length) params['presets'] = synced.presets.join(',');

  const group = synced.filterGroup;
  if (group && group.children.length > 0) {
    if (isFlatAndGroup(group)) {
      const filterParams = flattenLeaves(group).map(filterClauseToParam);
      if (filterParams.length > 0) params['filter'] = filterParams;
    } else {
      params['filterGroup'] = JSON.stringify(group);
    }
  }

  if (synced.columns?.length) {
    const hidden = synced.columns.filter((c) => !c.visible).map((c) => c.key);
    if (hidden.length) params['cols'] = hidden.join(',');
  }
  return params;
}

function flattenLeaves(group: FilterGroup): FilterClause[] {
  const out: FilterClause[] = [];
  for (const child of group.children) {
    if (isFilterGroup(child)) {
      // nested — only used when not flat AND; caller shouldn't hit this for filter=
      continue;
    }
    out.push(child);
  }
  return out;
}

export function paramsToListingQuery(
  params: Record<string, string | string[] | undefined>,
  defaults?: Partial<ListingQueryState>
): ListingQueryState {
  const base = createDefaultListingQuery(defaults?.pageSize ?? 20);
  let q: ListingQueryState = {
    ...base,
    ...defaults,
    filters: [],
    filterGroup: clausesToGroup([]),
  };

  const search = paramString(params['search']);
  if (search) q.search = search;

  const page = paramNumber(params['page']);
  if (page != null && page >= 1) q.page = page;

  const size = paramNumber(params['size']);
  if (size != null && size >= 1) q.pageSize = size;

  const sortRaw = paramString(params['sort']);
  if (sortRaw) {
    const [field, direction] = sortRaw.split(',');
    if (field && (direction === 'asc' || direction === 'desc')) {
      q.sort = { field, direction };
    }
  }

  const segment = paramString(params['segment']);
  if (segment) q.segment = segment;

  const presets = paramString(params['presets']);
  if (presets) q.presets = presets.split(',').map((s) => s.trim()).filter(Boolean);

  const scope = paramString(params['scope']) as ListingScope | undefined;
  if (scope === 'mine' || scope === 'archived' || scope === 'all') {
    q.scope = scope;
  }

  const groupRaw = paramString(params['filterGroup']);
  if (groupRaw) {
    const group = parseFilterGroupJson(groupRaw);
    if (group) {
      q = withSyncedFilters({ ...q, filterGroup: group });
    }
  } else {
    const filterRaw = params['filter'];
    const filterList = Array.isArray(filterRaw) ? filterRaw : filterRaw ? [filterRaw] : [];
    const filters = filterList
      .map((f) => parseFilterParam(String(f)))
      .filter((c): c is FilterClause => c != null);
    q = withSyncedFilters({ ...q, filterGroup: clausesToGroup(filters), filters });
  }

  const colsHidden = paramString(params['cols']);
  if (colsHidden) {
    const hidden = new Set(colsHidden.split(',').map((s) => s.trim()).filter(Boolean));
    if (defaults?.columns?.length) {
      q.columns = defaults.columns.map((c) => ({
        ...c,
        visible: !hidden.has(c.key),
      }));
    }
  }

  return q;
}

function paramString(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  const s = Array.isArray(value) ? value[0] : value;
  return s?.trim() || undefined;
}

function paramNumber(value: string | string[] | undefined): number | undefined {
  const s = paramString(value);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
