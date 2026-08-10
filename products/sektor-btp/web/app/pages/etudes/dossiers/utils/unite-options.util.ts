import { BPU_UNITS } from '@app/pages/chantiers/constants/bpu-units';
import type { UnitOfMeasure } from '@app/pages/inventory/configuration/unit-of-measures/models';

export interface UniteOption {
  code: string;
  label: string;
  /** UUID référentiel — utile pour créer un Item catalogue. */
  id?: string;
}

/**
 * Normalise pour comparaison.
 * NFKC d'abord : « ㎡ » (U+33A1) → « m2 », sinon le caractère est jeté par le filtre A-Z0-9.
 */
export function foldUnite(value: string): string {
  return value
    .normalize('NFKC')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toUpperCase()
    .replace(/³/g, '3')
    .replace(/²/g, '2')
    .replace(/[^A-Z0-9]/g, '');
}

/** Alias → code canonique (avant match référentiel). */
const ALIASES: Record<string, string> = {
  M3: 'M3',
  M2: 'M2',
  ML: 'ML',
  MLIN: 'ML',
  METRELINEAIRE: 'ML',
  KG: 'KG',
  KGS: 'KG',
  T: 'T',
  TO: 'T',
  TONNE: 'T',
  TONNES: 'T',
  U: 'U',
  UN: 'U',
  UNITE: 'U',
  UNITES: 'U',
  EA: 'EA',
  FF: 'FF',
  F: 'FF',
  FORFAIT: 'FF',
  H: 'H',
  HR: 'H',
  HEURE: 'H',
  HEURES: 'H',
  J: 'J',
  JOUR: 'J',
  JOURS: 'J',
  L: 'L',
  LITRE: 'L',
  LITRES: 'L',
  ENS: 'ENS',
  E: 'ENS',
  ENSEMBLE: 'ENS',
  PM: 'PM',
  POURMEMOIRE: 'PM',
};

export function mapToReferentialCode(raw: string | null | undefined, options: UniteOption[]): string | null {
  if (!raw?.trim()) return null;
  const folded = foldUnite(raw);
  if (!folded) return raw.trim();
  const aliased = ALIASES[folded] ?? folded;
  const byFold = new Map(options.map((o) => [foldUnite(o.code), o.code]));
  return byFold.get(aliased) ?? byFold.get(folded) ?? raw.trim();
}

export function toUniteOptions(units: UnitOfMeasure[]): UniteOption[] {
  const fromApi = units
    .filter((u) => u.isActive !== false && u.code?.trim())
    .map((u) => ({
      id: u.id,
      code: u.code.trim(),
      label: u.name?.trim() ? `${u.code.trim()} — ${u.name.trim()}` : u.code.trim(),
    }));
  if (fromApi.length > 0) {
    // Le référentiel contient des doublons de code (M2/m2, EA/ea…) : on n’en garde qu’un,
    // sinon chaque liste d’unités affiche deux fois la même entrée.
    const parCode = new Map<string, UniteOption>();
    for (const option of fromApi) {
      const key = foldUnite(option.code);
      if (!parCode.has(key)) parCode.set(key, option);
    }
    return [...parCode.values()].sort((a, b) => a.code.localeCompare(b.code, 'fr'));
  }
  return BPU_UNITS.map((code) => ({
    code,
    label: code,
  }));
}

/** Options de sélection : codes référentiel + valeur courante si hors liste. */
export function uniteOptionsForValue(
  options: UniteOption[],
  current: string | null | undefined,
): UniteOption[] {
  if (!current?.trim()) return options;
  const mapped = mapToReferentialCode(current, options);
  const candidate = mapped ?? current.trim();
  const folded = foldUnite(candidate);
  if (options.some((o) => foldUnite(o.code) === folded)) {
    return options;
  }
  const code = current.trim();
  return [{ code, label: `${code} (hors référentiel)` }, ...options];
}
