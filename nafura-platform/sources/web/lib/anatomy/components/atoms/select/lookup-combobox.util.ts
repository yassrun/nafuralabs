export const LOOKUP_COMBO_MIN_CHARS = 2;
export const LOOKUP_ORPHAN_LABEL = 'Enregistrement introuvable';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LookupComboOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function isUuidLike(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** No hits until the query has ≥ 2 characters (AC-2). Exact `value` match first (AC-3/4). */
export function filterLookupHits(
  options: readonly LookupComboOption[],
  query: string
): LookupComboOption[] {
  const q = query.trim().toLowerCase();
  if (q.length < LOOKUP_COMBO_MIN_CHARS) {
    return [];
  }
  const hits = options.filter((o) => {
    if (o.disabled) return false;
    const label = String(o.label ?? '').toLowerCase();
    const value = String(o.value ?? '').toLowerCase();
    return label.includes(q) || value.includes(q);
  });
  const exact = hits.filter((o) => String(o.value ?? '').toLowerCase() === q);
  const rest = hits.filter((o) => String(o.value ?? '').toLowerCase() !== q);
  return [...exact, ...rest];
}

/**
 * Parent templates often bind a fresh `options[]` every change-detection cycle
 * (`toNfSelectOptions(field)`). Server typeahead owns `comboHits` — re-searching
 * on that identity churn loops HTTP and freezes the form.
 */
export function comboHitsComeFromServer(lookupSearch: unknown): boolean {
  return typeof lookupSearch === 'function';
}

/** Filled combobox: typing is locked until the value is cleared (AC-15). */
export function comboTypingLocked(value: string | undefined | null): boolean {
  return String(value ?? '').trim().length > 0;
}

export function lookupOptionsEqual(
  a: readonly LookupComboOption[],
  b: readonly LookupComboOption[],
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].value !== b[i].value || a[i].label !== b[i].label) return false;
  }
  return true;
}

/** Empty → listing. Value set → `{list}/{id}` (AC-6 / AC-7). */
export function resolveLookupEyeRoute(
  listRoute: string | undefined,
  value: string | undefined | null
): string | undefined {
  const list = listRoute?.trim().replace(/\/$/, '');
  if (!list) {
    return undefined;
  }
  const id = String(value ?? '').trim();
  if (!id) {
    return list;
  }
  return `${list}/${id}`;
}

export function lookupDisplayLabel(
  value: string,
  options: readonly LookupComboOption[],
  selectedLabel?: string
): string {
  if (!value) {
    return '';
  }
  const hit = options.find((o) => o.value === value);
  if (hit) {
    return hit.label;
  }
  const known = selectedLabel?.trim();
  if (known) {
    return known;
  }
  if (isUuidLike(value)) {
    return LOOKUP_ORPHAN_LABEL;
  }
  return value;
}
