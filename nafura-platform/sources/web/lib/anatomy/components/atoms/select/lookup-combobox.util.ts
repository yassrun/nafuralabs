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
  const hits = options.filter(
    (o) =>
      !o.disabled &&
      (o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  );
  const exact = hits.filter((o) => o.value.toLowerCase() === q);
  const rest = hits.filter((o) => o.value.toLowerCase() !== q);
  return [...exact, ...rest];
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
