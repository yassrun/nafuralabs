import { BPU_UNITS } from '@app/pages/chantiers/constants/bpu-units';
import type { UnitOfMeasure } from '@app/pages/inventory/configuration/unit-of-measures/models';

export interface UniteOption {
  code: string;
  label: string;
  /** UUID référentiel — utile pour créer un Item catalogue. */
  id?: string;
}

/** Normalise pour comparaison (M3, m³, m3 → m3). */
export function foldUnite(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toUpperCase()
    .replace(/³/g, '3')
    .replace(/²/g, '2')
    .replace(/[^A-Z0-9]/g, '');
}

const ALIASES: Record<string, string> = {
  M3: 'M3',
  M2: 'M2',
  ML: 'ML',
  KG: 'KG',
  T: 'T',
  TO: 'T',
  TONNE: 'T',
  U: 'U',
  UN: 'U',
  UNITE: 'U',
  EA: 'EA',
  FF: 'FF',
  FORFAIT: 'FF',
  H: 'H',
  HEURE: 'H',
  J: 'J',
  JOUR: 'J',
  L: 'L',
  ENS: 'ENS',
};

export function mapToReferentialCode(raw: string | null | undefined, options: UniteOption[]): string | null {
  if (!raw?.trim()) return null;
  const folded = foldUnite(raw);
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
    return fromApi.sort((a, b) => a.code.localeCompare(b.code, 'fr'));
  }
  return BPU_UNITS.map((code) => ({
    code: code.toUpperCase() === code ? code : code,
    label: code,
  }));
}

/** Options de sélection : codes référentiel + valeur courante si hors liste. */
export function uniteOptionsForValue(
  options: UniteOption[],
  current: string | null | undefined,
): UniteOption[] {
  if (!current?.trim()) return options;
  const folded = foldUnite(current);
  if (options.some((o) => foldUnite(o.code) === folded)) {
    return options;
  }
  return [{ code: current.trim(), label: `${current.trim()} (hors référentiel)` }, ...options];
}
