import type {
  ColumnConfig,
  FilterClause,
  FilterCombinator,
  FilterFieldConfig,
  FilterGroup,
  FilterNode,
  FilterOperator,
  ListingQueryState,
  ListingSort,
} from '../../../types';
import { isFilterGroup } from '../../../types';

export function createDefaultListingQuery(pageSize = 20): ListingQueryState {
  return {
    filters: [],
    filterGroup: emptyFilterGroup(),
    page: 1,
    pageSize,
    sort: null,
    search: '',
  };
}

export function emptyFilterGroup(combinator: FilterCombinator = 'and'): FilterGroup {
  return { combinator, children: [] };
}

export function clausesToGroup(clauses: FilterClause[], combinator: FilterCombinator = 'and'): FilterGroup {
  return { combinator, children: [...clauses] };
}

/** True when group is a flat AND of leaf clauses only (backend / URL filter= compatible). */
export function isFlatAndGroup(group: FilterGroup | undefined | null): boolean {
  if (!group) return true;
  if (group.combinator !== 'and') return false;
  return group.children.every((child) => !isFilterGroup(child));
}

/** Flatten only when the tree is a pure AND of leaves; otherwise return []. */
export function flattenAndClauses(group: FilterGroup | undefined | null): FilterClause[] {
  if (!group || !isFlatAndGroup(group)) return [];
  return group.children.filter((c): c is FilterClause => !isFilterGroup(c));
}

/** Resolve active filter group from query (prefer filterGroup, else filters[]). */
export function resolveFilterGroup(query: ListingQueryState): FilterGroup {
  if (query.filterGroup) return query.filterGroup;
  return clausesToGroup(query.filters ?? []);
}

/** Sync derived `filters` from group when flat AND; otherwise keep filters empty. */
export function withSyncedFilters(query: ListingQueryState): ListingQueryState {
  const group = resolveFilterGroup(query);
  return {
    ...query,
    filterGroup: group,
    filters: isFlatAndGroup(group) ? flattenAndClauses(group) : [],
  };
}

/** Default filter operator per Anatomy filter field type (V1). */
export function defaultOperatorForFilterType(type: FilterFieldConfig['type'] | undefined): FilterOperator {
  switch (type) {
    case 'text':
      return 'contains';
    case 'number':
      return 'eq';
    case 'date':
      return 'eq';
    case 'daterange':
      return 'between';
    case 'select':
      return 'eq';
    case 'multiselect':
      return 'in';
    case 'boolean':
      return 'eq';
    default:
      return 'eq';
  }
}

/** Operators offered in the Notion builder for a field type. */
export function operatorsForFilterType(type: FilterFieldConfig['type'] | undefined): FilterOperator[] {
  switch (type) {
    case 'text':
      return ['contains', 'eq', 'ne', 'startsWith', 'isEmpty', 'isNotEmpty'];
    case 'number':
      return ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isEmpty', 'isNotEmpty'];
    case 'date':
    case 'daterange':
      return ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isEmpty', 'isNotEmpty'];
    case 'select':
      return ['eq', 'ne', 'in', 'isEmpty', 'isNotEmpty'];
    case 'multiselect':
      return ['in', 'eq', 'isEmpty', 'isNotEmpty'];
    case 'boolean':
      return ['eq', 'ne', 'isEmpty', 'isNotEmpty'];
    default:
      return ['eq', 'ne', 'isEmpty', 'isNotEmpty'];
  }
}

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'is',
  ne: 'is not',
  contains: 'contains',
  startsWith: 'starts with',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: 'is any of',
  between: 'is between',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
};

export function clausesToFilterValues(clauses: FilterClause[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const clause of clauses) {
    if (clause.op === 'isEmpty' || clause.op === 'isNotEmpty') {
      out[clause.field] = clause.op;
      continue;
    }
    if (clause.value !== undefined) out[clause.field] = clause.value;
  }
  return out;
}

/** Values for pinned controls: last leaf clause per field. */
export function filterGroupToPinnedValues(group: FilterGroup): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (nodes: FilterNode[]) => {
    for (const node of nodes) {
      if (isFilterGroup(node)) {
        walk(node.children);
        continue;
      }
      if (node.op === 'isEmpty' || node.op === 'isNotEmpty') continue;
      if (node.value !== undefined && node.value !== null && node.value !== '') {
        out[node.field] = node.value;
      }
    }
  };
  walk(group.children);
  return out;
}

export function filterValuesToClauses(
  values: Record<string, unknown>,
  fields: FilterFieldConfig[]
): FilterClause[] {
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));
  const clauses: FilterClause[] = [];
  for (const [field, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    const cfg = fieldByKey.get(field);
    clauses.push({
      field,
      op: defaultOperatorForFilterType(cfg?.type),
      value,
    });
  }
  return clauses;
}

/**
 * Upsert a pinned field value into the root group as a default-op leaf.
 * Removes existing leaves for that field at the root level only.
 */
export function upsertPinnedClause(
  group: FilterGroup,
  field: FilterFieldConfig,
  value: unknown
): FilterGroup {
  const without = group.children.filter(
    (node) => isFilterGroup(node) || node.field !== field.key
  );
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return { ...group, children: without };
  }
  const clause: FilterClause = {
    field: field.key,
    op: defaultOperatorForFilterType(field.type),
    value,
  };
  return { ...group, children: [...without, clause] };
}

/** Remove a leaf by depth-first index among all leaves. */
export function removeLeafAt(group: FilterGroup, leafIndex: number): FilterGroup {
  let remaining = leafIndex;
  const strip = (node: FilterNode): FilterNode | null => {
    if (!isFilterGroup(node)) {
      if (remaining === 0) {
        remaining -= 1;
        return null;
      }
      remaining -= 1;
      return node;
    }
    const children = node.children.map(strip).filter((c): c is FilterNode => c != null);
    return { ...node, children };
  };
  const next = strip(group);
  if (!next || !isFilterGroup(next)) return emptyFilterGroup(group.combinator);
  return next;
}

export function collectLeaves(group: FilterGroup): FilterClause[] {
  const out: FilterClause[] = [];
  const walk = (nodes: FilterNode[]) => {
    for (const node of nodes) {
      if (isFilterGroup(node)) walk(node.children);
      else out.push(node);
    }
  };
  walk(group.children);
  return out;
}

export function mergeListingQuery(
  base: ListingQueryState,
  patch: Partial<ListingQueryState>
): ListingQueryState {
  const merged: ListingQueryState = {
    ...base,
    ...patch,
    filters: patch.filters ?? base.filters,
    filterGroup: patch.filterGroup ?? base.filterGroup,
    columns: patch.columns ?? base.columns,
  };
  if (patch.filterGroup) {
    return withSyncedFilters(merged);
  }
  if (patch.filters && !patch.filterGroup) {
    return withSyncedFilters({
      ...merged,
      filterGroup: clausesToGroup(patch.filters),
    });
  }
  return merged;
}

/** Compare saved-view / dirty state (ignores transient page if desired). */
export function listingQuerySnapshotEqual(
  a: ListingQueryState,
  b: ListingQueryState,
  options?: { ignorePage?: boolean }
): boolean {
  const strip = (q: ListingQueryState) => {
    const synced = withSyncedFilters(q);
    const copy: ListingQueryState = {
      ...synced,
      filters: [...synced.filters],
      filterGroup: synced.filterGroup,
    };
    if (options?.ignorePage) {
      copy.page = 1;
    }
    if (copy.search === '') delete copy.search;
    if (!copy.sort) copy.sort = null;
    return JSON.stringify(copy);
  };
  return strip(a) === strip(b);
}

function fieldValue(item: unknown, key: string): unknown {
  if (item == null || typeof item !== 'object') return undefined;
  return (item as Record<string, unknown>)[key];
}

function compareValues(a: unknown, b: unknown): number {
  const sa = a == null ? '' : String(a);
  const sb = b == null ? '' : String(b);
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' });
}

/** Client-side sort for local listing mode. */
export function sortItemsLocally<T>(
  items: T[],
  sort: ListingSort | null | undefined,
  columns: ColumnConfig[]
): T[] {
  if (!sort?.field || !sort.direction) return items;
  const col = columns.find((c) => c.key === sort.field || c.field === sort.field);
  const field = col?.field ?? sort.field;
  const dir = sort.direction === 'desc' ? -1 : 1;
  return [...items].sort(
    (left, right) => compareValues(fieldValue(left, field), fieldValue(right, field)) * dir
  );
}

export function controlColumnsFromQuery(
  columns: ColumnConfig[],
  columnState?: ListingQueryState['columns']
): { key: string; label: string; visible: boolean }[] {
  const visibility = new Map(columnState?.map((c) => [c.key, c.visible]));
  return columns.map((c) => ({
    key: c.key,
    label: c.label,
    visible: visibility.has(c.key) ? visibility.get(c.key)! : true,
  }));
}

export function columnStateFromControls(
  controls: { key: string; visible: boolean }[]
): ListingQueryState['columns'] {
  return controls.map((c) => ({ key: c.key, visible: c.visible }));
}
