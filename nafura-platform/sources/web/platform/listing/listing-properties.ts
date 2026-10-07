import type {
  BadgeVariant,
  ColumnConfig,
  FilterFieldConfig,
  FilterGroup,
  FilterNode,
  FilterOperator,
  ListingQueryState,
} from '../../lib/anatomy/types';

/**
 * The record's properties as `GET {endpoint}/properties` returns them, and the pure translations a list needs:
 * columns, builder fields, and the filter grammar the API takes. No Angular here: tested under node.
 */

export type PropertyType =
  | 'text'
  | 'number'
  | 'money'
  | 'date'
  | 'boolean'
  | 'status'
  | 'select'
  | 'relation'
  | 'relations'
  | 'person';

export interface PropertyValue {
  id: string;
  label: string;
  tone?: BadgeVariant;
}

export interface RecordPropertyView {
  label: string;
  type: PropertyType;
  filterable: boolean;
  sortable: boolean;
  /** Relation(s): the target record, its API and its `/options`. */
  target?: string;
  endpoint?: string;
  options?: string;
  /** Relation: the field of this record holding the target's label. */
  display?: string;
  /** Relations: the field of the target pointing back here. */
  via?: string;
  currency?: string;
  /** Status (lifecycle states) or select values. */
  values?: PropertyValue[];
}

export type RecordProperties = Record<string, RecordPropertyView>;

/** The filter grammar of the API: a criterion `{ property: { operator: value } }` or `and` / `or` of them. */
export type RecordFilter = { and: RecordFilter[] } | { or: RecordFilter[] } | { [property: string]: Record<string, unknown> };

/** Operators the grammar accepts, per property type, as the builder names them. */
const BUILDER_OPERATORS: Record<PropertyType, FilterOperator[]> = {
  text: ['contains', 'eq', 'ne', 'startsWith', 'isEmpty', 'isNotEmpty'],
  number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isEmpty', 'isNotEmpty'],
  money: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isEmpty', 'isNotEmpty'],
  date: ['eq', 'lt', 'gt', 'between', 'isEmpty', 'isNotEmpty'],
  boolean: ['eq'],
  status: ['eq', 'ne', 'in'],
  select: ['eq', 'ne', 'in'],
  relation: ['eq', 'in', 'isEmpty', 'isNotEmpty'],
  relations: [],
  person: ['eq', 'isEmpty', 'isNotEmpty'],
};

const BUILDER_TYPE: Record<PropertyType, FilterFieldConfig['type']> = {
  text: 'text',
  number: 'number',
  money: 'number',
  date: 'date',
  boolean: 'boolean',
  status: 'select',
  select: 'select',
  relation: 'select',
  relations: 'text',
  person: 'select',
};

/** A field the builder can filter on: a property, or `relation.property` of its target (one hop). */
export interface FilterTarget {
  property: string;
  type: PropertyType;
  /** Set for `relation.property`: the relation crossed and its type. */
  relation?: { key: string; type: 'relation' | 'relations' };
}

export function filterTargets(properties: RecordProperties, targets: Record<string, RecordProperties> = {}): Map<string, FilterTarget> {
  const fields = new Map<string, FilterTarget>();
  for (const [key, property] of Object.entries(properties)) {
    if (!property.filterable) continue;
    if (property.type !== 'relations') fields.set(key, { property: key, type: property.type });
    if ((property.type === 'relation' || property.type === 'relations') && property.target) {
      for (const [sub, target] of Object.entries(targets[property.target] ?? {})) {
        if (!target.filterable || target.type === 'relation' || target.type === 'relations') continue;
        fields.set(`${key}.${sub}`, { property: sub, type: target.type, relation: { key, type: property.type } });
      }
    }
  }
  return fields;
}

/** Builder fields: every filterable property, plus the filterable properties of each relation's target. */
export function filterFields(
  properties: RecordProperties,
  targets: Record<string, RecordProperties> = {},
  relationOptions: Record<string, Array<{ label: string; value: unknown }>> = {},
): FilterFieldConfig[] {
  const fields: FilterFieldConfig[] = [];
  for (const [key, target] of filterTargets(properties, targets)) {
    const owner = target.relation ? properties[target.relation.key] : properties[key];
    const property = target.relation ? targets[owner.target!][target.property] : owner;
    fields.push({
      key,
      label: target.relation ? `${owner.label} · ${property.label}` : property.label,
      type: BUILDER_TYPE[target.type],
      operators: BUILDER_OPERATORS[target.type],
      options: options(property, target.relation ? undefined : relationOptions[key]),
    });
  }
  return fields;
}

function options(property: RecordPropertyView, relation?: Array<{ label: string; value: unknown }>): Array<{ label: string; value: unknown }> | undefined {
  if (property.type === 'status' || property.type === 'select') return (property.values ?? []).map((value) => ({ label: value.label, value: value.id }));
  if (property.type === 'person') return [{ label: 'listing.me', value: 'me' }];
  if (property.type === 'relation') return relation ?? [];
  return undefined;
}

/** The builder's tree as the API's grammar. Clauses on unknown fields or with no value are dropped. */
export function toRecordFilter(group: FilterGroup | null | undefined, targets: Map<string, FilterTarget>): RecordFilter | null {
  if (!group || group.children.length === 0) return null;
  const children = group.children.map((child) => node(child, targets)).filter((child): child is RecordFilter => child != null);
  if (children.length === 0) return null;
  if (children.length === 1) return children[0];
  return group.combinator === 'or' ? { or: children } : { and: children };
}

function node(child: FilterNode, targets: Map<string, FilterTarget>): RecordFilter | null {
  if ('children' in child) return toRecordFilter(child, targets);
  const target = targets.get(child.field);
  if (!target) return null;
  const criterion = criterionOf(target.type, child.op, child.value);
  if (!criterion) return null;
  const leaf: RecordFilter = { [target.property]: criterion };
  if (!target.relation) return leaf;
  return { [target.relation.key]: { [target.relation.type === 'relations' ? 'any' : 'where']: leaf } };
}

function criterionOf(type: PropertyType, op: FilterOperator, raw: unknown): Record<string, unknown> | null {
  if (op === 'isEmpty' || op === 'isNotEmpty') return { empty: op === 'isEmpty' };
  if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) return null;
  const numeric = type === 'number' || type === 'money';
  const value = (item: unknown) => (numeric ? Number(item) : type === 'boolean' ? item === true || item === 'true' : item);
  if (op === 'between') {
    if (!Array.isArray(raw) || raw.length < 2 || raw[0] === '' || raw[1] === '') return null;
    return { between: [value(raw[0]), value(raw[1])] };
  }
  if (op === 'in') return { in: (Array.isArray(raw) ? raw : [raw]).map(value) };
  if (numeric) return { [op]: value(raw) };
  switch (op) {
    case 'eq':
      return { is: value(raw) };
    case 'ne':
      return { isNot: value(raw) };
    case 'lt':
      return { before: raw };
    case 'gt':
      return { after: raw };
    case 'contains':
    case 'startsWith':
      return { [op]: raw };
    default:
      return null;
  }
}

/** `and` of the non-empty filters, or `null`. */
export function allOf(...filters: Array<RecordFilter | null | undefined>): RecordFilter | null {
  const present = filters.filter((filter): filter is RecordFilter => filter != null);
  if (present.length === 0) return null;
  return present.length === 1 ? present[0] : { and: present };
}

/** Query string of a server-paged list (page is 0-based). Repeated `sort` = multi-level. */
export function listParams(
  query: ListingQueryState | undefined,
  filter: RecordFilter | null,
  pageSize: number
): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {
    page: String(Math.max(0, (query?.page ?? 1) - 1)),
    size: String(query?.pageSize || pageSize),
  };
  const search = query?.search?.trim();
  if (search) params['q'] = search;
  // Colon, not comma: Spring binds `sort=field,asc` as two list values.
  const sorts = (query?.sort ?? []).filter((s) => s?.field && (s.direction === 'asc' || s.direction === 'desc'));
  if (sorts.length === 1) {
    params['sort'] = `${sorts[0].field}:${sorts[0].direction}`;
  } else if (sorts.length > 1) {
    params['sort'] = sorts.map((s) => `${s.field}:${s.direction}`);
  }
  if (filter) params['filter'] = JSON.stringify(filter);
  return params;
}

/** Columns of a view, in `show` order, formatted by property type. */
export function columnsOf(show: string[], properties: RecordProperties, format: (key: string, value: unknown, row: unknown) => string): ColumnConfig[] {
  return show
    .filter((key) => properties[key] && properties[key].type !== 'relations')
    .map((key) => {
      const property = properties[key];
      const column: ColumnConfig = {
        key,
        label: property.label,
        field: property.type === 'relation' && property.display ? property.display : key,
        sortable: property.sortable,
        transform: (value: unknown, row: unknown) => format(key, property.type === 'relation' && property.display ? (row as Record<string, unknown>)[key] : value, row),
      };
      if (property.type === 'date') column.type = 'date';
      if (property.type === 'boolean') column.translate = true;
      if (property.type === 'status' || property.type === 'select') {
        column.type = 'badge';
        column.badgeVariant = (value: unknown) => property.values?.find((item) => item.id === value)?.tone ?? 'default';
      }
      return column;
    });
}

/** The text a cell or a card shows for a property. */
export function formatValue(property: RecordPropertyView | undefined, value: unknown, row: Record<string, unknown> = {}, locale = 'fr-MA'): string {
  if (!property) return value == null ? '' : String(value);
  if (property.type === 'relation') {
    const label = property.display ? row[property.display] : undefined;
    return label == null || label === '' ? '—' : String(label);
  }
  if (value == null || value === '') return '—';
  switch (property.type) {
    case 'money': {
      const amount = Number(value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return property.currency ? `${amount} ${property.currency}` : amount;
    }
    case 'number':
      return Number(value).toLocaleString(locale);
    case 'status':
    case 'select':
      return property.values?.find((item) => item.id === value)?.label ?? String(value);
    case 'boolean':
      return value === true ? 'Yes' : 'No';
    default:
      return String(value);
  }
}
