import { Injectable, computed, signal } from '@angular/core';

/**
 * Catalogue d'un taux TVA paramétrable (Task 17 M-MA-04).
 * Permet à l'administrateur de définir tous les taux applicables à la société
 * (20 / 14 / 10 / 7 / 0 %) et un taux par défaut.
 */
export interface FiscalTvaRate {
  /** Identifiant stable (utilisé en seed + persistance). */
  id: string;
  /** Taux en pourcentage (0..20). */
  taux: number;
  /** Libellé court (ex. « TVA standard »). */
  libelle: string;
  /** Description / périmètre d'application (BTP, logement social, exportation…). */
  description: string;
  /** Marqueur « taux par défaut » (un seul à la fois — non garanti côté type). */
  isDefault: boolean;
}

/** Paramètres fiscaux persistés (même schéma que l’historique `nafura-fiscal-settings`). */
export interface FiscalSettings {
  retenueSouceTaux: number;
  retenueSouceSeuil: number;
  timbreFiscalTaux: number;
  timbreFiscalSeuil: number;
  timbreFiscalPlafond: number;
  autoliquidationTvaActivee: boolean;
  exonerationLogementSocial: boolean;
  /**
   * % de la TVA en autoliquidation retenu à la source sur le paiement (démo MA) :
   * net payé au fournisseur = HT − (TVA autoliq × ce taux / 100). 0 = pas de retenue.
   */
  retenueTvaSurAutoliquidationTaux: number;
  /**
   * Catalogue paramétrable des taux TVA MA (M-MA-04).
   * Seeds : 20 (standard) / 14 (logement social) / 10 (intermédiaire) / 7 (réduit) / 0 (exonéré).
   */
  tvaRates: FiscalTvaRate[];
}

export const FISCAL_SETTINGS_STORAGE_KEY = 'nafura-fiscal-settings';

/** Catalogue par défaut des taux TVA marocains (CGI 2026). */
export const DEFAULT_TVA_RATES_MA: FiscalTvaRate[] = [
  { id: 'tva-20', taux: 20, libelle: 'TVA Standard', description: 'BTP, travaux neufs, services', isDefault: true },
  { id: 'tva-14', taux: 14, libelle: 'TVA Réduite', description: 'Logement social, certains travaux', isDefault: false },
  { id: 'tva-10', taux: 10, libelle: 'TVA Intermédiaire', description: 'Eau, assainissement, hôtellerie', isDefault: false },
  { id: 'tva-7',  taux: 7,  libelle: 'TVA Réduite 7%', description: 'Produits/services spécifiques', isDefault: false },
  { id: 'tva-0',  taux: 0,  libelle: 'Exonéré', description: 'Exportations, art. 92 CGI, marchés exonérés', isDefault: false },
];

function defaultSettings(): FiscalSettings {
  return {
    retenueSouceTaux: 5,
    retenueSouceSeuil: 0,
    timbreFiscalTaux: 0.25,
    timbreFiscalSeuil: 10_000,
    timbreFiscalPlafond: 100,
    autoliquidationTvaActivee: false,
    exonerationLogementSocial: false,
    retenueTvaSurAutoliquidationTaux: 100,
    tvaRates: DEFAULT_TVA_RATES_MA,
  };
}

function loadFromStorage(): FiscalSettings {
  try {
    const raw = localStorage.getItem(FISCAL_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FiscalSettings>;
      // Migration douce : si l'utilisateur n'a pas encore le catalogue TVA, on seed.
      const tvaRates = Array.isArray(parsed.tvaRates) && parsed.tvaRates.length > 0
        ? parsed.tvaRates
        : DEFAULT_TVA_RATES_MA;
      return { ...defaultSettings(), ...parsed, tvaRates };
    }
  } catch {
    /* noop */
  }
  return defaultSettings();
}

@Injectable({ providedIn: 'root' })
export class FiscalSettingsService {
  private readonly _settings = signal<FiscalSettings>(loadFromStorage());

  readonly settings = this._settings.asReadonly();

  /** Catalogue TVA (M-MA-04) — utilisable directement dans les selects/templates. */
  readonly tvaRates = computed<readonly FiscalTvaRate[]>(() => this._settings().tvaRates);

  /** Taux TVA par défaut — 20 % si aucun marqueur. */
  readonly defaultTvaRate = computed<number>(() => {
    const list = this._settings().tvaRates;
    const def = list.find((t) => t.isDefault);
    return def?.taux ?? list[0]?.taux ?? 20;
  });

  snapshot(): FiscalSettings {
    return { ...this._settings() };
  }

  save(partial: FiscalSettings): void {
    try {
      localStorage.setItem(FISCAL_SETTINGS_STORAGE_KEY, JSON.stringify(partial));
    } catch {
      /* noop */
    }
    this._settings.set({ ...partial });
  }

  /**
   * Met à jour exclusivement le catalogue des taux TVA.
   * Garantit qu'il y a toujours **au plus un** marqueur `isDefault`.
   */
  setTvaRates(rates: FiscalTvaRate[]): void {
    const normalized = this.normalizeRates(rates);
    this.save({ ...this._settings(), tvaRates: normalized });
  }

  /** Retourne un taux TVA par id, ou `undefined` si introuvable. */
  findTvaRate(id: string): FiscalTvaRate | undefined {
    return this._settings().tvaRates.find((t) => t.id === id);
  }

  /**
   * Résout un taux applicable :
   *  - si `exonere` (ex. marché public art. 92), renvoie 0 systématiquement
   *  - sinon retourne le taux explicite (`taux`) ou le défaut société.
   */
  resolveTaux(opts?: { taux?: number; exonere?: boolean }): number {
    if (opts?.exonere) return 0;
    if (typeof opts?.taux === 'number') return opts.taux;
    return this.defaultTvaRate();
  }

  private normalizeRates(rates: FiscalTvaRate[]): FiscalTvaRate[] {
    let foundDefault = false;
    return rates.map((r) => {
      const isDefault = r.isDefault && !foundDefault;
      if (isDefault) foundDefault = true;
      return { ...r, isDefault };
    });
  }
}
