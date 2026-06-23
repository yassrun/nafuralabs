import { Injectable, computed, inject, signal } from '@angular/core';

import type {
  OperationType,
  SimulateAmounts,
  SimulationResult,
} from './comptable-mapping.service';
import { ComptableMappingService } from './comptable-mapping.service';
import { SocieteService } from './societe.service';

/**
 * Journal automatique des Opérations Diverses (OD) générées par les
 * événements métier ERP (validation facture, encaissement, paie, etc.).
 *
 * Stratégie M-ADM-10 P2 (mock-only) :
 *  - chaque appel `record*(...)` traduit l'événement métier en montants
 *    bruts, délègue à `ComptableMappingService.simulate(...)` pour
 *    obtenir l'OD équilibrée, puis l'archive dans un journal persisté.
 *  - les `entries[]` sont immutables (append-only) avec un id stable basé
 *    sur l'événement source (`ref`) pour pouvoir détecter et idempotenter
 *    les re-validations (annule + recrée).
 *  - persistance localStorage `nafura-auto-journal-od` pour survivre aux
 *    reloads et permettre la visualisation côté admin sans backend.
 */

export interface AutoJournalEntry {
  /** Id unique stable `od-{operationType}-{ref}-{ts36}`. */
  id: string;
  /** Type d'opération source (cf. ComptableMappingService). */
  operationType: OperationType;
  /** Référence métier de l'événement source (numéro facture, ref encaissement…). */
  sourceRef: string;
  /** Module/page d'origine pour traçabilité (FACTURE_VENTE, FACTURE_MARCHE, PAIE…). */
  sourceModule: string;
  /** Société comptable d'application. */
  societeId: string | null;
  /** Société libellé (snapshot, pour affichage stable même si suppression). */
  societeLibelle?: string;
  /** Date à laquelle l'OD a été générée (ISO yyyy-mm-dd hh:mm:ss). */
  generatedAt: string;
  /** Résultat de la simulation : journal, lignes, totaux, équilibre. */
  simulation: SimulationResult;
  /** Montants source ayant alimenté la simulation (audit/replay). */
  sourceAmounts: SimulateAmounts;
  /** Libellé résolu (template `libelleEcriture` du mapping + ref). */
  libelleResolu: string;
}

export interface RecordOptions {
  /** Idempotence : si une OD existe déjà avec ce `sourceRef`+`operationType`, la remplace. */
  replaceExisting?: boolean;
}

const STORAGE_KEY = 'nafura-auto-journal-od';

function loadEntries(): AutoJournalEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AutoJournalEntry[]) : [];
  } catch {
    return [];
  }
}

function persistEntries(entries: AutoJournalEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* noop */ }
}

function resolveLibelle(template: string, sourceRef: string, periode?: string): string {
  return template
    .replace(/\{\{numero\}\}/g, sourceRef)
    .replace(/\{\{ref\}\}/g, sourceRef)
    .replace(/\{\{periode\}\}/g, periode ?? new Date().toISOString().slice(0, 7));
}

@Injectable({ providedIn: 'root' })
export class AutoJournalService {
  private readonly mappingSvc = inject(ComptableMappingService);
  private readonly societeSvc = inject(SocieteService);

  private readonly _entries = signal<AutoJournalEntry[]>(loadEntries());

  readonly entries = this._entries.asReadonly();

  /** Stats agrégées pour la page admin. */
  readonly stats = computed(() => {
    const list = this._entries();
    const balanced = list.filter((e) => e.simulation.isBalanced).length;
    const byType = new Map<OperationType, number>();
    let totalDebit = 0;
    let totalCredit = 0;
    list.forEach((e) => {
      byType.set(e.operationType, (byType.get(e.operationType) ?? 0) + 1);
      totalDebit += e.simulation.totalDebit;
      totalCredit += e.simulation.totalCredit;
    });
    return {
      total: list.length,
      balanced,
      unbalanced: list.length - balanced,
      totalDebit,
      totalCredit,
      operationTypes: byType.size,
    };
  });

  /** Filtre les entrées par société (utilisé sur la page admin). */
  entriesForSociete(societeId: string | null): readonly AutoJournalEntry[] {
    if (societeId === null) return this._entries();
    return this._entries().filter((e) => e.societeId === societeId);
  }

  /**
   * Cœur générique : applique le mapping résolu pour `op` aux montants donnés.
   * Renvoie l'OD générée (ou `null` si aucun mapping actif).
   */
  record(
    op: OperationType,
    sourceRef: string,
    sourceModule: string,
    amounts: SimulateAmounts,
    opts?: RecordOptions,
  ): AutoJournalEntry | null {
    const societeId = this.societeSvc.currentSocieteId();
    const simulation = this.mappingSvc.simulate(op, amounts, societeId);
    if (!simulation) return null;
    const entry: AutoJournalEntry = {
      id: `od-${op.toLowerCase()}-${sourceRef.replace(/[^a-z0-9-]/gi, '')}-${Date.now().toString(36)}`,
      operationType: op,
      sourceRef,
      sourceModule,
      societeId,
      societeLibelle: this.societeSvc.currentSociete()?.raisonSociale,
      generatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      simulation,
      sourceAmounts: amounts,
      libelleResolu: resolveLibelle(simulation.mapping.libelleEcriture, sourceRef),
    };
    this._entries.update((cur) => {
      const next = opts?.replaceExisting
        ? cur.filter((e) => !(e.sourceRef === sourceRef && e.operationType === op))
        : cur;
      const updated = [...next, entry];
      persistEntries(updated);
      return updated;
    });
    return entry;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers spécialisés branchés sur les pages métier.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Facture de vente directe (module ventes/factures).
   * Convention : si `chantierId` présent, on classe en VENTE_MARCHE_PRIVE,
   * sinon VENTE_DIRECTE.
   */
  recordFactureVente(facture: {
    numero: string;
    totalHt: number;
    totalTva: number;
    netAPayerTtc?: number;
    chantierId?: string;
  }): AutoJournalEntry | null {
    const op: OperationType = facture.chantierId ? 'VENTE_MARCHE_PRIVE' : 'VENTE_DIRECTE';
    const ttc = facture.netAPayerTtc ?? facture.totalHt + facture.totalTva;
    return this.record(op, facture.numero, 'FACTURE_VENTE', {
      ht: facture.totalHt,
      tva: facture.totalTva,
      ttc,
    }, { replaceExisting: true });
  }

  /**
   * Facture de marché public/privé (module marches/factures) avec RAS, RG, timbre.
   * Source = `FactureMarche` du modèle marchés.
   */
  recordFactureMarche(facture: {
    numero: string;
    netHt: number;
    tvaMontant: number;
    netTtc: number;
    retenueSourceMontant: number;
    timbreFiscal: number;
    netAPayer: number;
    isPublic?: boolean;
  }): AutoJournalEntry | null {
    const op: OperationType = facture.isPublic === false
      ? 'VENTE_MARCHE_PRIVE'
      : 'VENTE_MARCHE_PUBLIC';
    return this.record(op, facture.numero, 'FACTURE_MARCHE', {
      ht: facture.netHt,
      tva: facture.tvaMontant,
      ttc: facture.netTtc,
      ras: facture.retenueSourceMontant,
      timbre: facture.timbreFiscal,
      netAPayer: facture.netAPayer,
    }, { replaceExisting: true });
  }

  /**
   * Encaissement client (banque ou caisse selon `modePaiement`).
   */
  recordEncaissement(input: {
    ref: string;
    montant: number;
    modePaiement: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES' | 'COMPENSATION';
  }): AutoJournalEntry | null {
    const op: OperationType = input.modePaiement === 'ESPECES'
      ? 'REGLEMENT_CLIENT_CAISSE'
      : 'REGLEMENT_CLIENT_BANQUE';
    return this.record(op, input.ref, 'ENCAISSEMENT', {
      ttc: input.montant,
      netAPayer: input.montant,
    }, { replaceExisting: true });
  }

  /**
   * Facture fournisseur (module finance/factures-fournisseurs).
   * Auto-classifie en ACHAT_SOUS_TRAITANCE si `nature='SOUS_TRAITANCE'`,
   * ACHAT_MATIERES par défaut, ACHAT_FRAIS_GENERAUX si `nature='FRAIS_GENERAUX'`.
   */
  recordFactureFournisseur(facture: {
    ref: string;
    totalHt: number;
    totalTva: number;
    totalTtc: number;
    retenueSourceMontant?: number;
    nature?: 'SOUS_TRAITANCE' | 'MATIERES' | 'FRAIS_GENERAUX' | 'IMMOBILISATION';
  }): AutoJournalEntry | null {
    const op: OperationType =
      facture.nature === 'SOUS_TRAITANCE' ? 'ACHAT_SOUS_TRAITANCE' :
      facture.nature === 'FRAIS_GENERAUX' ? 'ACHAT_FRAIS_GENERAUX' :
      facture.nature === 'IMMOBILISATION' ? 'IMMOBILISATION_ACQUISITION' :
      'ACHAT_MATIERES';
    const ras = facture.retenueSourceMontant ?? 0;
    const netAPayer = facture.totalTtc - ras;
    return this.record(op, facture.ref, 'FACTURE_FOURNISSEUR', {
      ht: facture.totalHt,
      tva: facture.totalTva,
      ttc: facture.totalTtc,
      ras,
      netAPayer,
    }, { replaceExisting: true });
  }

  /**
   * Paiement fournisseur (banque ou caisse selon `modePaiement`).
   */
  recordPaiementFournisseur(input: {
    ref: string;
    montant: number;
    modePaiement: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES';
  }): AutoJournalEntry | null {
    const op: OperationType = input.modePaiement === 'ESPECES'
      ? 'REGLEMENT_FOURNISSEUR_CAISSE'
      : 'REGLEMENT_FOURNISSEUR_BANQUE';
    return this.record(op, input.ref, 'PAIEMENT_FOURNISSEUR', {
      netAPayer: input.montant,
    }, { replaceExisting: true });
  }

  /** Supprime une entrée du journal (admin uniquement). */
  removeEntry(id: string): void {
    this._entries.update((cur) => {
      const next = cur.filter((e) => e.id !== id);
      persistEntries(next);
      return next;
    });
  }

  /** Vide complètement le journal (QA / reset). */
  clear(): void {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    }
    this._entries.set([]);
  }
}
