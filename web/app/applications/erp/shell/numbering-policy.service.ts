/**
 * Numbering Policy Service — M-ADM-08.
 *
 * Configurable numbering per (société × type de document). Sits next to the legacy
 * `NumberingService` (which now delegates here when a matching active policy exists).
 *
 * Persistence pattern (identical to `SocieteService` / `MoaService` / `BanqueService`) :
 *   - `nafura-numbering-policies-overrides` : Record<id, Partial<NumberingPolicy>>
 *   - `nafura-numbering-policies-created`   : NumberingPolicy[]
 *   - `nafura-numbering-policies-deleted`   : string[]
 *   - `nafura-numbering-policies-counters`  : Record<bucketKey, number>
 *
 * The 4th key (counters) is the live state of sequential counters, keyed by
 * `{docType}|{societeId}|{period}` so that resetPolicy NEVER/YEARLY/MONTHLY all work.
 *
 * 7 system seeds cover the 7 document types of M-ADM-07 (DEVIS, BC_ACHAT,
 * FACTURE_VENTE, BL, SITUATION, ATTACHEMENT, CONTRAT_ST). Custom policies for
 * other (société × type) couples can be created from the admin page.
 */

import { Injectable, computed, signal } from '@angular/core';

import {
  buildBucketKey,
  defaultPattern,
  formatNumber,
  type NumberingPolicyFormatLike,
  type ResetPolicy,
  type YearFormat,
} from './numbering-format';

/** Document types covered by configurable numbering. Aligned with M-ADM-07 seeds. */
export type NumberingDocType =
  | 'DEVIS'
  | 'BON_COMMANDE_ACHAT'
  | 'FACTURE_VENTE'
  | 'BON_LIVRAISON'
  | 'SITUATION_TRAVAUX'
  | 'ATTACHEMENT'
  | 'CONTRAT_SOUS_TRAITANCE';

export const NUMBERING_DOC_TYPES: readonly NumberingDocType[] = [
  'DEVIS',
  'BON_COMMANDE_ACHAT',
  'FACTURE_VENTE',
  'BON_LIVRAISON',
  'SITUATION_TRAVAUX',
  'ATTACHEMENT',
  'CONTRAT_SOUS_TRAITANCE',
];

// @i18n-exempt — @deprecated Phase 1.2 — see NUMBERING_DOC_TYPE_KEYS in @applications/erp/shell/i18n-labels.
export const NUMBERING_DOC_TYPE_LABELS: Record<NumberingDocType, string> = {
  DEVIS: 'Devis',
  BON_COMMANDE_ACHAT: 'Bon de commande (achat)',
  FACTURE_VENTE: 'Facture client',
  BON_LIVRAISON: 'Bon de livraison / Réception',
  SITUATION_TRAVAUX: 'Situation de travaux',
  ATTACHEMENT: 'Attachement',
  CONTRAT_SOUS_TRAITANCE: 'Contrat de sous-traitance',
};

/** A numbering policy = how to format and increment numbers for one (société × doc type) couple. */
export interface NumberingPolicy {
  id: string;
  societeId: string;
  docType: NumberingDocType;
  prefix: string;
  separator: string;
  yearFormat: YearFormat;
  padLength: number;
  /** Optional custom pattern. Empty string ⇒ default pattern is used. */
  pattern: string;
  /** Step between consecutive numbers (usually 1). */
  incrementBy: number;
  resetPolicy: ResetPolicy;
  /** When false, this policy is ignored and legacy hard-coded format takes over. */
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyInput {
  societeId: string;
  docType: NumberingDocType;
  prefix: string;
  separator?: string;
  yearFormat?: YearFormat;
  padLength?: number;
  pattern?: string;
  incrementBy?: number;
  resetPolicy?: ResetPolicy;
  isActive?: boolean;
}

const STORAGE_OVERRIDES = 'nafura-numbering-policies-overrides';
const STORAGE_CREATED = 'nafura-numbering-policies-created';
const STORAGE_DELETED = 'nafura-numbering-policies-deleted';
const STORAGE_COUNTERS = 'nafura-numbering-policies-counters';

type OverridePatch = Partial<Omit<NumberingPolicy, 'id'>>;
type OverridesMap = Record<string, OverridePatch>;
type Counters = Record<string, number>;

function loadJson<T>(key: string, fallback: T, validate: (v: unknown) => v is T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function persistJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const isPolicyArray = (v: unknown): v is NumberingPolicy[] =>
  Array.isArray(v) &&
  v.every((p) => isObject(p) && typeof p['id'] === 'string' && typeof p['prefix'] === 'string');

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const isCountersMap = (v: unknown): v is Counters =>
  isObject(v) && Object.values(v).every((n) => typeof n === 'number');

const isOverridesMap = (v: unknown): v is OverridesMap =>
  isObject(v) && Object.values(v).every((p) => isObject(p));

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Builds the 7 seed policies. All assigned to the default société id
 * (will resolve at runtime — we keep `'__ALL__'` here so that any société
 * uses these defaults unless a tenant-specific custom override exists).
 */
const SEED_SOCIETE_ID = '__ALL__';

const POLICY_SEEDS: NumberingPolicy[] = [
  {
    id: 'pol-sys-devis',
    societeId: SEED_SOCIETE_ID,
    docType: 'DEVIS',
    prefix: 'DEV',
    separator: '-',
    yearFormat: 'YYYY',
    padLength: 4,
    pattern: '',
    incrementBy: 1,
    resetPolicy: 'YEARLY',
    isActive: true,
    isSystem: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'pol-sys-bc-achat',
    societeId: SEED_SOCIETE_ID,
    docType: 'BON_COMMANDE_ACHAT',
    prefix: 'BC',
    separator: '-',
    yearFormat: 'YYYY',
    padLength: 5,
    pattern: '',
    incrementBy: 1,
    resetPolicy: 'YEARLY',
    isActive: true,
    isSystem: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'pol-sys-facture-vente',
    societeId: SEED_SOCIETE_ID,
    docType: 'FACTURE_VENTE',
    prefix: 'FAC',
    separator: '-',
    yearFormat: 'YYYY',
    padLength: 5,
    pattern: '',
    incrementBy: 1,
    resetPolicy: 'YEARLY',
    isActive: true,
    isSystem: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'pol-sys-bon-livraison',
    societeId: SEED_SOCIETE_ID,
    docType: 'BON_LIVRAISON',
    prefix: 'BL',
    separator: '-',
    yearFormat: 'YYYY',
    padLength: 4,
    pattern: '',
    incrementBy: 1,
    resetPolicy: 'YEARLY',
    isActive: true,
    isSystem: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'pol-sys-situation',
    societeId: SEED_SOCIETE_ID,
    docType: 'SITUATION_TRAVAUX',
    prefix: 'SIT',
    separator: '-',
    yearFormat: 'YYYY',
    padLength: 3,
    pattern: '',
    incrementBy: 1,
    resetPolicy: 'YEARLY',
    isActive: true,
    isSystem: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'pol-sys-attachement',
    societeId: SEED_SOCIETE_ID,
    docType: 'ATTACHEMENT',
    prefix: 'ATT',
    separator: '-',
    yearFormat: 'YYYY',
    padLength: 3,
    pattern: '',
    incrementBy: 1,
    resetPolicy: 'YEARLY',
    isActive: true,
    isSystem: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'pol-sys-contrat-st',
    societeId: SEED_SOCIETE_ID,
    docType: 'CONTRAT_SOUS_TRAITANCE',
    prefix: 'CST',
    separator: '-',
    yearFormat: 'YYYY',
    padLength: 3,
    pattern: '',
    incrementBy: 1,
    resetPolicy: 'YEARLY',
    isActive: true,
    isSystem: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
];

function slug(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function applyOverrides(seeds: readonly NumberingPolicy[], overrides: OverridesMap): NumberingPolicy[] {
  return seeds.map((p) => {
    const patch = overrides[p.id];
    return patch ? ({ ...p, ...patch } as NumberingPolicy) : p;
  });
}

function buildView(
  seeds: readonly NumberingPolicy[],
  created: readonly NumberingPolicy[],
  overrides: OverridesMap,
  deleted: ReadonlySet<string>,
): NumberingPolicy[] {
  const liveSeeds = seeds.filter((p) => !deleted.has(p.id));
  const liveCreated = created.filter((p) => !deleted.has(p.id));
  return [...applyOverrides(liveSeeds, overrides), ...applyOverrides(liveCreated, overrides)];
}

@Injectable({ providedIn: 'root' })
export class NumberingPolicyService {
  private readonly _overrides = signal<OverridesMap>(
    loadJson<OverridesMap>(STORAGE_OVERRIDES, {}, isOverridesMap),
  );
  private readonly _created = signal<NumberingPolicy[]>(
    loadJson<NumberingPolicy[]>(STORAGE_CREATED, [], isPolicyArray),
  );
  private readonly _deleted = signal<Set<string>>(
    new Set(loadJson<string[]>(STORAGE_DELETED, [], isStringArray)),
  );
  private readonly _counters = signal<Counters>(
    loadJson<Counters>(STORAGE_COUNTERS, {}, isCountersMap),
  );

  private readonly _list = signal<NumberingPolicy[]>(
    buildView(POLICY_SEEDS, this._created(), this._overrides(), this._deleted()),
  );

  readonly policies = this._list.asReadonly();
  readonly counters = this._counters.asReadonly();

  /** All known doc types (constant exposed for the admin page). */
  readonly docTypes = NUMBERING_DOC_TYPES;
  readonly docTypeLabels = NUMBERING_DOC_TYPE_LABELS;

  /**
   * Computed view: count of policies per docType — used by admin page stats card.
   */
  readonly stats = computed(() => {
    const list = this._list();
    const counters = this._counters();
    return {
      total: list.length,
      active: list.filter((p) => p.isActive).length,
      system: list.filter((p) => p.isSystem).length,
      custom: list.filter((p) => !p.isSystem).length,
      countersTracked: Object.keys(counters).length,
    };
  });

  private refresh(): void {
    this._list.set(buildView(POLICY_SEEDS, this._created(), this._overrides(), this._deleted()));
  }

  /**
   * Resolves the active policy for a given (société, docType) couple.
   * Resolution order :
   *   1. Tenant-specific custom (societeId === actualSocieteId)
   *   2. Tenant-specific override of a system seed (id starts with pol-sys but overridden for société)
   *      → currently no per-société override of system seeds; falls through to (3).
   *   3. System seed (societeId === __ALL__) for the docType
   *   4. null
   */
  resolveActive(societeId: string, docType: NumberingDocType): NumberingPolicy | null {
    const list = this._list();
    const exact = list.find(
      (p) => p.isActive && p.docType === docType && p.societeId === societeId,
    );
    if (exact) return exact;
    const wildcard = list.find(
      (p) => p.isActive && p.docType === docType && p.societeId === SEED_SOCIETE_ID,
    );
    return wildcard ?? null;
  }

  findById(id: string): NumberingPolicy | undefined {
    return this._list().find((p) => p.id === id);
  }

  /** All policies for one société id (tenant) plus its inherited system seeds. */
  forSociete(societeId: string): NumberingPolicy[] {
    const list = this._list();
    return NUMBERING_DOC_TYPES.map(
      (dt) =>
        list.find((p) => p.docType === dt && p.societeId === societeId) ??
        list.find((p) => p.docType === dt && p.societeId === SEED_SOCIETE_ID) ??
        null,
    ).filter((p): p is NumberingPolicy => p != null);
  }

  /**
   * Preview the next number for a (société, docType) without incrementing the counter.
   * Use in the admin page «Aperçu» column.
   */
  peekNumber(
    societeId: string,
    docType: NumberingDocType,
    options: { year?: number; societeCode?: string } = {},
  ): string | null {
    const policy = this.resolveActive(societeId, docType);
    if (!policy) return null;
    const key = buildBucketKey(docType, policy.societeId, policy.resetPolicy);
    const current = this._counters()[key] ?? 0;
    return formatNumber(policy as NumberingPolicyFormatLike, {
      counter: current + policy.incrementBy,
      year: options.year,
      societeCode: options.societeCode,
    });
  }

  /**
   * Reserves and returns the next number. Increments the counter and persists.
   */
  nextNumber(
    societeId: string,
    docType: NumberingDocType,
    options: { year?: number; societeCode?: string } = {},
  ): string | null {
    const policy = this.resolveActive(societeId, docType);
    if (!policy) return null;
    const key = buildBucketKey(docType, policy.societeId, policy.resetPolicy);
    const counters = { ...this._counters() };
    const current = counters[key] ?? 0;
    const next = current + policy.incrementBy;
    counters[key] = next;
    this._counters.set(counters);
    persistJson(STORAGE_COUNTERS, counters);
    return formatNumber(policy as NumberingPolicyFormatLike, {
      counter: next,
      year: options.year,
      societeCode: options.societeCode,
    });
  }

  /** Read the live counter for a policy's current bucket (admin page display). */
  currentCounter(policy: NumberingPolicy): number {
    const key = buildBucketKey(policy.docType, policy.societeId, policy.resetPolicy);
    return this._counters()[key] ?? 0;
  }

  /** Force the counter to a value (Admin page «Définir la séquence»). */
  setCounter(policy: NumberingPolicy, value: number): void {
    const key = buildBucketKey(policy.docType, policy.societeId, policy.resetPolicy);
    const counters = { ...this._counters(), [key]: Math.max(0, Math.floor(value)) };
    this._counters.set(counters);
    persistJson(STORAGE_COUNTERS, counters);
  }

  /** Reset the counter to zero for a policy's current bucket. */
  resetSequence(policy: NumberingPolicy): void {
    const key = buildBucketKey(policy.docType, policy.societeId, policy.resetPolicy);
    const counters = { ...this._counters() };
    delete counters[key];
    this._counters.set(counters);
    persistJson(STORAGE_COUNTERS, counters);
  }

  createPolicy(input: CreatePolicyInput): NumberingPolicy {
    const id = `pol-custom-${slug(input.docType)}-${slug(input.societeId)}-${Date.now().toString(36)}`;
    const policy: NumberingPolicy = {
      id,
      societeId: input.societeId,
      docType: input.docType,
      prefix: input.prefix,
      separator: input.separator ?? '-',
      yearFormat: input.yearFormat ?? 'YYYY',
      padLength: input.padLength ?? 4,
      pattern: input.pattern ?? '',
      incrementBy: input.incrementBy ?? 1,
      resetPolicy: input.resetPolicy ?? 'YEARLY',
      isActive: input.isActive ?? true,
      isSystem: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const created = [...this._created(), policy];
    this._created.set(created);
    persistJson(STORAGE_CREATED, created);
    this.refresh();
    return policy;
  }

  updatePolicy(id: string, patch: OverridePatch): NumberingPolicy | null {
    const customIdx = this._created().findIndex((p) => p.id === id);
    if (customIdx >= 0) {
      const next = { ...this._created()[customIdx], ...patch, updatedAt: nowIso() };
      const arr = [
        ...this._created().slice(0, customIdx),
        next,
        ...this._created().slice(customIdx + 1),
      ];
      this._created.set(arr);
      persistJson(STORAGE_CREATED, arr);
      this.refresh();
      return next;
    }
    const seed = POLICY_SEEDS.find((p) => p.id === id);
    if (!seed) return null;
    const previous = this._overrides()[id] ?? {};
    const merged: OverridePatch = { ...previous, ...patch, updatedAt: nowIso() };
    const overrides = { ...this._overrides(), [id]: merged };
    this._overrides.set(overrides);
    persistJson(STORAGE_OVERRIDES, overrides);
    this.refresh();
    return this.findById(id) ?? null;
  }

  /** Reverts a system seed to its original definition. No-op for custom policies. */
  revertPolicy(id: string): NumberingPolicy | null {
    if (!POLICY_SEEDS.some((p) => p.id === id)) return null;
    if (!this._overrides()[id]) return this.findById(id) ?? null;
    const overrides = { ...this._overrides() };
    delete overrides[id];
    this._overrides.set(overrides);
    persistJson(STORAGE_OVERRIDES, overrides);
    this.refresh();
    return this.findById(id) ?? null;
  }

  isOverridden(id: string): boolean {
    return !!this._overrides()[id];
  }

  deletePolicy(id: string): boolean {
    const customIdx = this._created().findIndex((p) => p.id === id);
    if (customIdx >= 0) {
      const arr = [
        ...this._created().slice(0, customIdx),
        ...this._created().slice(customIdx + 1),
      ];
      this._created.set(arr);
      persistJson(STORAGE_CREATED, arr);
      this.refresh();
      return true;
    }
    if (!POLICY_SEEDS.some((p) => p.id === id)) return false;
    const deleted = new Set(this._deleted());
    deleted.add(id);
    this._deleted.set(deleted);
    persistJson(STORAGE_DELETED, [...deleted]);
    if (this._overrides()[id]) {
      const overrides = { ...this._overrides() };
      delete overrides[id];
      this._overrides.set(overrides);
      persistJson(STORAGE_OVERRIDES, overrides);
    }
    this.refresh();
    return true;
  }

  /** Restore everything to seeds + zero counters. QA helper. */
  reset(): void {
    this._overrides.set({});
    this._created.set([]);
    this._deleted.set(new Set());
    this._counters.set({});
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_OVERRIDES);
      localStorage.removeItem(STORAGE_CREATED);
      localStorage.removeItem(STORAGE_DELETED);
      localStorage.removeItem(STORAGE_COUNTERS);
    }
    this.refresh();
  }

  /** Helper exposed for tests / preview UI. */
  defaultPatternFor(yearFormat: YearFormat): string {
    return defaultPattern(yearFormat);
  }
}
