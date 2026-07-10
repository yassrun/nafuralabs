import { Injectable, signal } from '@angular/core';

/**
 * Catalogue des entités ERP supportées par la numérotation centralisée.
 *
 * Chaque type a un format défini dans {@link FORMATS} et un compteur
 * persisté dans `localStorage` sous la clé {@link STORAGE_KEY}.
 */
export type EntityNumberingType =
  | 'BC'             // Bon de commande achats — BC-{YYYY}-{#####}
  | 'DA'             // Demande d'achat — DA-{YYYY}-{####}
  | 'AO'             // Appel d'offres achats — AO-{YYYY}-{####}
  | 'AOC'            // Appel d'offres client (études) — AOC-{YYYY}-{####}
  | 'CONTRAT_ACHAT'  // Contrat fournisseur — CONTRAT-{YYYY}-{###}
  | 'FF'             // Facture fournisseur — FF-{YYYY}-{#####}
  | 'FM'             // Facture marché client — FM-{YYYY}-{#####}
  | 'DEVIS'          // Devis client — DV-{YYYY}-{####} (préfixe métier historique)
  | 'CMD_VENTE'      // Commande vente — CMD-{YYYY}-{####}
  | 'MAR'            // Marché client — MAR-{YYYY}-{###}
  | 'SIT'            // Situation de travaux — SIT-{CHANTIER_CODE}-{###}
  | 'AVN'            // Avenant marché — AV-{PARENT_REF}-{##}
  | 'BL'             // Bon de livraison — BL-{YYYY}-{####}
  | 'BR'             // Bon de réception — BR-{YYYY}-{####}
  | 'OF'             // Ordre de fabrication — OF-{YYYY}-{####}
  | 'CNG'            // Congé RH — CNG-{YYYY}-{####}
  | 'FICHE_PAIE'     // Fiche de paie — PAI-{YYYY}-{####}
  | 'PV'             // PV de réception — PV-{YYYY}-{####}
  | 'DGD';           // Décompte général définitif — DGD-{YYYY}-{####}

/** Portée du compteur. `YEAR` reset annuel, `PARENT` clé sur un parent (chantier, marché…). */
export type NumberingScope = 'YEAR' | 'PARENT';

export interface NumberingFormat {
  /** Préfixe du numéro (avant la première séparation). */
  readonly prefix: string;
  /** Largeur de zéro-padding du compteur. */
  readonly pad: number;
  /** Portée du compteur. */
  readonly scope: NumberingScope;
}

/**
 * Format par type d'entité. Modifiable centralement quand le besoin client évolue.
 *
 * Les longueurs de pad ont été alignées sur les seeds existants :
 * BC sur 5 chiffres (ex : `BC-2026-00001`), DA/AO/DEVIS sur 4 (`DA-2026-0001`),
 * CONTRAT/MAR sur 3 (`CONTRAT-2026-001`), SIT sur 3 (`SIT-CH-2026-001-001`),
 * AVN sur 2 (`AV-MAR-2026-001-03`).
 */
export const FORMATS: Record<EntityNumberingType, NumberingFormat> = {
  BC:            { prefix: 'BC',      pad: 5, scope: 'YEAR' },
  DA:            { prefix: 'DA',      pad: 4, scope: 'YEAR' },
  AO:            { prefix: 'AO',      pad: 4, scope: 'YEAR' },
  AOC:           { prefix: 'AOC',     pad: 4, scope: 'YEAR' },
  CONTRAT_ACHAT: { prefix: 'CONTRAT', pad: 3, scope: 'YEAR' },
  FF:            { prefix: 'FF',      pad: 5, scope: 'YEAR' },
  FM:            { prefix: 'FM',      pad: 5, scope: 'YEAR' },
  DEVIS:         { prefix: 'DV',      pad: 4, scope: 'YEAR' },
  CMD_VENTE:     { prefix: 'CMD',     pad: 4, scope: 'YEAR' },
  MAR:           { prefix: 'MAR',     pad: 3, scope: 'YEAR' },
  SIT:           { prefix: 'SIT',     pad: 3, scope: 'PARENT' },
  AVN:           { prefix: 'AV',      pad: 2, scope: 'PARENT' },
  BL:            { prefix: 'BL',      pad: 4, scope: 'YEAR' },
  BR:            { prefix: 'BR',      pad: 4, scope: 'YEAR' },
  OF:            { prefix: 'OF',      pad: 4, scope: 'YEAR' },
  CNG:           { prefix: 'CNG',     pad: 4, scope: 'YEAR' },
  FICHE_PAIE:    { prefix: 'PAI',     pad: 4, scope: 'YEAR' },
  PV:            { prefix: 'PV',      pad: 4, scope: 'YEAR' },
  DGD:           { prefix: 'DGD',     pad: 4, scope: 'YEAR' },
};

const STORAGE_KEY = 'nafura-erp-numbering';

export interface NumberingOptions {
  /** Code chantier pour les types `SIT` (ex : `CH-2026-001`). */
  chantierCode?: string;
  /** Référence parent pour les types `AVN` (ex : `MAR-2026-001`). */
  parentRef?: string;
  /** Année cible (par défaut année courante). */
  year?: number;
}

type NumberingCounters = Record<string, number>;

function loadCounters(): NumberingCounters {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NumberingCounters) : {};
  } catch {
    return {};
  }
}

function saveCounters(counters: NumberingCounters): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(counters)); } catch { /* ignore */ }
}

function resolveParent(opts: NumberingOptions | undefined): string | undefined {
  return opts?.parentRef ?? opts?.chantierCode;
}

/**
 * Service centralisé de numérotation des entités ERP.
 *
 * Pattern :
 * - `nextNumber('BC')` réserve et retourne `BC-2026-00042` (incrémente le compteur).
 * - `peekNumber('BC')` retourne le prochain numéro sans incrémenter (preview UI).
 * - `seedIfBelow('BC', 8)` aligne le compteur sur l'état mock initial (idempotent).
 * - `resetCounters()` purge le storage (helper démo).
 *
 * Stockage : `localStorage["nafura-erp-numbering"] = { "BC-2026": 42, "SIT-CH-2026-001": 7, … }`.
 */
@Injectable({ providedIn: 'root' })
export class NumberingService {
  private readonly _counters = signal<NumberingCounters>(loadCounters());

  /** Snapshot lecture seule des compteurs courants. */
  readonly counters = this._counters.asReadonly();

  /** Catalogue des formats (exposé pour l'admin / pages de paramétrage). */
  readonly formats = FORMATS;

  /**
   * Construit la clé de stockage du compteur pour un type & options donnés.
   *
   * - Scope `YEAR`  → `BC-2026`.
   * - Scope `PARENT` → `SIT-CH-2026-001` (chantier) ou `AVN-MAR-2026-001` (avenant).
   */
  buildKey(type: EntityNumberingType, opts?: NumberingOptions): string {
    const fmt = FORMATS[type];
    if (fmt.scope === 'PARENT') {
      const parent = resolveParent(opts) ?? '__NONE__';
      return `${type}-${parent}`;
    }
    const year = opts?.year ?? new Date().getFullYear();
    return `${type}-${year}`;
  }

  /**
   * Construit la chaîne formatée à partir d'un compteur résolu.
   * Privé : utilisé par `nextNumber` / `peekNumber`.
   */
  private buildNumber(type: EntityNumberingType, counter: number, opts?: NumberingOptions): string {
    const fmt = FORMATS[type];
    const padded = String(counter).padStart(fmt.pad, '0');
    if (fmt.scope === 'PARENT') {
      const parent = resolveParent(opts) ?? '';
      return `${fmt.prefix}-${parent}-${padded}`;
    }
    const year = opts?.year ?? new Date().getFullYear();
    return `${fmt.prefix}-${year}-${padded}`;
  }

  /**
   * Réserve et retourne le prochain numéro (incrémente le compteur, persiste).
   *
   * @example
   * numbering.nextNumber('BC');                                  // 'BC-2026-00042'
   * numbering.nextNumber('SIT', { chantierCode: 'CH-2026-001' });// 'SIT-CH-2026-001-007'
   * numbering.nextNumber('AVN', { parentRef: 'MAR-2026-001' });  // 'AV-MAR-2026-001-03'
   * numbering.nextNumber('DEVIS', { year: 2026 });               // 'DV-2026-0009'
   * numbering.nextNumber('AOC', { year: 2026 });               // 'AOC-2026-0013'
   */
  nextNumber(type: EntityNumberingType, opts?: NumberingOptions): string {
    const key = this.buildKey(type, opts);
    let nextCounter = 1;
    this._counters.update((current) => {
      const updated: NumberingCounters = { ...current };
      const last = updated[key] ?? 0;
      nextCounter = last + 1;
      updated[key] = nextCounter;
      saveCounters(updated);
      return updated;
    });
    return this.buildNumber(type, nextCounter, opts);
  }

  /**
   * Retourne le prochain numéro qui *serait* émis sans toucher au compteur.
   * Utile pour pré-remplir un champ « Numéro » en édition.
   */
  peekNumber(type: EntityNumberingType, opts?: NumberingOptions): string {
    const key = this.buildKey(type, opts);
    const next = (this._counters()[key] ?? 0) + 1;
    return this.buildNumber(type, next, opts);
  }

  /**
   * Aligne le compteur sur une valeur existante si celle-ci est plus haute.
   * Permet aux mock services d'amorcer la séquence à partir des seeds
   * sans réinitialiser la séquence persistée.
   */
  seedIfBelow(type: EntityNumberingType, value: number, opts?: NumberingOptions): void {
    if (!Number.isFinite(value) || value <= 0) return;
    const key = this.buildKey(type, opts);
    this._counters.update((current) => {
      const last = current[key] ?? 0;
      if (value <= last) return current;
      const updated = { ...current, [key]: value };
      saveCounters(updated);
      return updated;
    });
  }

  /**
   * Purge l'intégralité des compteurs (helper démo / reset env).
   * Synchronise signal + `localStorage`.
   */
  resetCounters(): void {
    this._counters.set({});
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}
