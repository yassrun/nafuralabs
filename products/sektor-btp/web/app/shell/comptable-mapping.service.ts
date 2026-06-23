import { Injectable, computed, inject, signal } from '@angular/core';

import { SocieteService } from './societe.service';

/**
 * Types d'opérations métier qui génèrent automatiquement une écriture
 * comptable (OD = Opération Diverse) lors de leur validation.
 *
 * Couvre les flux ERP BTP Maroc :
 *  - facturation client (vente directe + situation marché public/privé)
 *  - facturation fournisseur (achat matières + sous-traitance + frais généraux)
 *  - règlements (banque, caisse, mixte avec timbre)
 *  - paie (salaires bruts, charges sociales CNSS/AMO, IR retenue)
 *  - déclarations fiscales (TVA mensuelle, RAS reversée à la DGI)
 */
export type OperationType =
  | 'VENTE_DIRECTE'
  | 'VENTE_MARCHE_PUBLIC'
  | 'VENTE_MARCHE_PRIVE'
  | 'ACHAT_MATIERES'
  | 'ACHAT_SOUS_TRAITANCE'
  | 'ACHAT_FRAIS_GENERAUX'
  | 'REGLEMENT_CLIENT_BANQUE'
  | 'REGLEMENT_CLIENT_CAISSE'
  | 'REGLEMENT_FOURNISSEUR_BANQUE'
  | 'REGLEMENT_FOURNISSEUR_CAISSE'
  | 'PAIE_SALAIRE'
  | 'PAIE_CHARGES_SOCIALES'
  | 'DECLARATION_TVA'
  | 'DECLARATION_RAS'
  | 'IMMOBILISATION_ACQUISITION';

// @i18n-exempt — @deprecated Phase 1.2 — TODO Wave C: migrate to centralised `enum.*` keys (B2 phase only delivered the keys file + JSON for prescribed maps).
export const OPERATION_LABELS: Record<OperationType, string> = {
  VENTE_DIRECTE: 'Vente directe (Facture client comptant)',
  VENTE_MARCHE_PUBLIC: 'Vente marché public (Situation travaux)',
  VENTE_MARCHE_PRIVE: 'Vente marché privé (Situation travaux)',
  ACHAT_MATIERES: 'Achat matières premières',
  ACHAT_SOUS_TRAITANCE: 'Achat sous-traitance BTP',
  ACHAT_FRAIS_GENERAUX: 'Achat frais généraux',
  REGLEMENT_CLIENT_BANQUE: 'Règlement client (banque)',
  REGLEMENT_CLIENT_CAISSE: 'Règlement client (caisse)',
  REGLEMENT_FOURNISSEUR_BANQUE: 'Règlement fournisseur (banque)',
  REGLEMENT_FOURNISSEUR_CAISSE: 'Règlement fournisseur (caisse)',
  PAIE_SALAIRE: 'Paie — salaires bruts',
  PAIE_CHARGES_SOCIALES: 'Paie — charges sociales (CNSS, AMO)',
  DECLARATION_TVA: 'Déclaration TVA mensuelle',
  DECLARATION_RAS: 'Déclaration RAS (reversement DGI)',
  IMMOBILISATION_ACQUISITION: 'Acquisition immobilisation',
};

/**
 * Type de montant à utiliser pour la ligne dans la simulation d'OD.
 *  - HT          : montant hors taxes
 *  - TVA         : montant de la TVA calculée
 *  - TTC         : HT + TVA
 *  - RAS         : retenue à la source (5% HT pour marchés publics)
 *  - NET_A_PAYER : TTC − RAS − timbre
 *  - TIMBRE      : timbre fiscal pour règlement espèces
 *  - CHARGE_PATR : charges patronales CNSS/AMO
 *  - SALAIRE_NET : net à payer salarié
 *  - IR          : retenue IR
 */
export type AmountSource =
  | 'HT'
  | 'TVA'
  | 'TTC'
  | 'RAS'
  | 'NET_A_PAYER'
  | 'TIMBRE'
  | 'CHARGE_PATR'
  | 'SALAIRE_NET'
  | 'IR';

export interface MappingLine {
  id: string;
  side: 'DEBIT' | 'CREDIT';
  compteCode: string;
  compteLibelle: string;
  amountSource: AmountSource;
  /** Note ou condition d'application (ex. « si MOA = ÉTAT »). */
  conditionLibelle?: string;
}

export interface ComptableMapping {
  id: string;
  operationType: OperationType;
  /**
   * Société à laquelle s'applique le mapping. `'__ALL__'` = mapping
   * système hérité par toutes les sociétés tant qu'aucune n'a créé d'override.
   */
  societeId: string;
  journalCode: string;
  journalLibelle: string;
  libelleEcriture: string;
  lignes: MappingLine[];
  isSystem: boolean;
  isActif: boolean;
}

export interface SimulateAmounts {
  ht?: number;
  tva?: number;
  ttc?: number;
  ras?: number;
  netAPayer?: number;
  timbre?: number;
  chargePatronale?: number;
  salaireNet?: number;
  ir?: number;
}

export interface SimulatedEntry {
  side: 'DEBIT' | 'CREDIT';
  compteCode: string;
  compteLibelle: string;
  amount: number;
  source: AmountSource;
  conditionLibelle?: string;
}

export interface SimulationResult {
  mapping: ComptableMapping;
  entries: SimulatedEntry[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

const OVERRIDES_KEY = 'nafura-mapping-comptable-overrides';
const CREATED_KEY = 'nafura-mapping-comptable-created';
const DELETED_KEY = 'nafura-mapping-comptable-deleted';

// ──────────────────────────────────────────────────────────────────────────
// SEEDS — 15 mappings système conformes CGNC Maroc + spécificités BTP
// ──────────────────────────────────────────────────────────────────────────
function seed(
  operationType: OperationType,
  journalCode: string,
  journalLibelle: string,
  libelleEcriture: string,
  lignes: Omit<MappingLine, 'id'>[],
): ComptableMapping {
  return {
    id: `map-sys-${operationType.toLowerCase().replace(/_/g, '-')}`,
    operationType,
    societeId: '__ALL__',
    journalCode,
    journalLibelle,
    libelleEcriture,
    isSystem: true,
    isActif: true,
    lignes: lignes.map((l, i) => ({ ...l, id: `${operationType.toLowerCase()}-l${i + 1}` })),
  };
}

export const SEED_MAPPINGS: readonly ComptableMapping[] = [
  seed('VENTE_DIRECTE', 'VTE', 'Journal de ventes', 'Facture client {{numero}}', [
    { side: 'DEBIT',  compteCode: '3421', compteLibelle: 'Clients',                              amountSource: 'TTC' },
    { side: 'CREDIT', compteCode: '7111', compteLibelle: 'Ventes de marchandises au Maroc',      amountSource: 'HT'  },
    { side: 'CREDIT', compteCode: '4455', compteLibelle: 'État, TVA facturée',                   amountSource: 'TVA' },
  ]),
  seed('VENTE_MARCHE_PUBLIC', 'VTE', 'Journal de ventes', 'Situation travaux marché public {{ref}}', [
    { side: 'DEBIT',  compteCode: '3421',   compteLibelle: 'Clients',                              amountSource: 'NET_A_PAYER' },
    { side: 'DEBIT',  compteCode: '3458',   compteLibelle: 'État, retenue à la source à récupérer', amountSource: 'RAS',
      conditionLibelle: 'Si MOA = personne morale de droit public (5% HT)' },
    { side: 'CREDIT', compteCode: '7124',   compteLibelle: 'Travaux',                              amountSource: 'HT'  },
    { side: 'CREDIT', compteCode: '4455',   compteLibelle: 'État, TVA facturée',                   amountSource: 'TVA' },
  ]),
  seed('VENTE_MARCHE_PRIVE', 'VTE', 'Journal de ventes', 'Situation travaux marché privé {{ref}}', [
    { side: 'DEBIT',  compteCode: '3421', compteLibelle: 'Clients',                              amountSource: 'TTC' },
    { side: 'CREDIT', compteCode: '7124', compteLibelle: 'Travaux',                              amountSource: 'HT'  },
    { side: 'CREDIT', compteCode: '4455', compteLibelle: 'État, TVA facturée',                   amountSource: 'TVA' },
  ]),
  seed('ACHAT_MATIERES', 'ACH', 'Journal des achats', 'Facture fournisseur matières {{ref}}', [
    { side: 'DEBIT',  compteCode: '6121', compteLibelle: 'Achats de matières premières',         amountSource: 'HT'  },
    { side: 'DEBIT',  compteCode: '3455', compteLibelle: 'État, TVA récupérable',                amountSource: 'TVA' },
    { side: 'CREDIT', compteCode: '4411', compteLibelle: 'Fournisseurs',                         amountSource: 'TTC' },
  ]),
  seed('ACHAT_SOUS_TRAITANCE', 'ACH', 'Journal des achats', 'Facture sous-traitant BTP {{ref}}', [
    { side: 'DEBIT',  compteCode: '6131', compteLibelle: 'Sous-traitance générale',              amountSource: 'HT'  },
    { side: 'DEBIT',  compteCode: '3455', compteLibelle: 'État, TVA récupérable',                amountSource: 'TVA' },
    { side: 'CREDIT', compteCode: '4411', compteLibelle: 'Fournisseurs',                         amountSource: 'NET_A_PAYER' },
    { side: 'CREDIT', compteCode: '4457', compteLibelle: 'État, retenue à la source à payer',    amountSource: 'RAS',
      conditionLibelle: 'Si sous-traitant non-résident ou personne physique' },
  ]),
  seed('ACHAT_FRAIS_GENERAUX', 'ACH', 'Journal des achats', 'Frais généraux {{ref}}', [
    { side: 'DEBIT',  compteCode: '6133', compteLibelle: 'Entretien et réparations',             amountSource: 'HT'  },
    { side: 'DEBIT',  compteCode: '3455', compteLibelle: 'État, TVA récupérable',                amountSource: 'TVA' },
    { side: 'CREDIT', compteCode: '4411', compteLibelle: 'Fournisseurs',                         amountSource: 'TTC' },
  ]),
  seed('REGLEMENT_CLIENT_BANQUE', 'BAN', 'Journal de banque', 'Encaissement client {{ref}}', [
    { side: 'DEBIT',  compteCode: '5141', compteLibelle: 'Banques',                              amountSource: 'NET_A_PAYER' },
    { side: 'CREDIT', compteCode: '3421', compteLibelle: 'Clients',                              amountSource: 'NET_A_PAYER' },
  ]),
  seed('REGLEMENT_CLIENT_CAISSE', 'CAI', 'Journal de caisse', 'Encaissement caisse client {{ref}}', [
    { side: 'DEBIT',  compteCode: '5161', compteLibelle: 'Caisse',                               amountSource: 'TTC' },
    { side: 'CREDIT', compteCode: '3421', compteLibelle: 'Clients',                              amountSource: 'TTC' },
    { side: 'CREDIT', compteCode: '4459', compteLibelle: 'État, autres impôts (timbre)',         amountSource: 'TIMBRE',
      conditionLibelle: 'Si paiement espèces > seuil' },
  ]),
  seed('REGLEMENT_FOURNISSEUR_BANQUE', 'BAN', 'Journal de banque', 'Paiement fournisseur {{ref}}', [
    { side: 'DEBIT',  compteCode: '4411', compteLibelle: 'Fournisseurs',                         amountSource: 'NET_A_PAYER' },
    { side: 'CREDIT', compteCode: '5141', compteLibelle: 'Banques',                              amountSource: 'NET_A_PAYER' },
  ]),
  seed('REGLEMENT_FOURNISSEUR_CAISSE', 'CAI', 'Journal de caisse', 'Paiement caisse fournisseur {{ref}}', [
    { side: 'DEBIT',  compteCode: '4411', compteLibelle: 'Fournisseurs',                         amountSource: 'NET_A_PAYER' },
    { side: 'CREDIT', compteCode: '5161', compteLibelle: 'Caisse',                               amountSource: 'NET_A_PAYER' },
  ]),
  seed('PAIE_SALAIRE', 'PAI', 'Journal de paie', 'Salaires bruts mois {{periode}}', [
    { side: 'DEBIT',  compteCode: '6171', compteLibelle: 'Rémunérations du personnel',           amountSource: 'HT' /* = brut */ },
    { side: 'CREDIT', compteCode: '4432', compteLibelle: 'Rémunérations dues au personnel',      amountSource: 'SALAIRE_NET' },
    { side: 'CREDIT', compteCode: '4441', compteLibelle: 'CNSS / AMO part salariale',            amountSource: 'CHARGE_PATR' },
    { side: 'CREDIT', compteCode: '4452', compteLibelle: 'État, IR salaires',                    amountSource: 'IR' },
  ]),
  seed('PAIE_CHARGES_SOCIALES', 'PAI', 'Journal de paie', 'Charges sociales {{periode}}', [
    { side: 'DEBIT',  compteCode: '6174', compteLibelle: 'Charges sociales',                     amountSource: 'CHARGE_PATR' },
    { side: 'CREDIT', compteCode: '4441', compteLibelle: 'CNSS / AMO',                           amountSource: 'CHARGE_PATR' },
  ]),
  seed('DECLARATION_TVA', 'OD', 'Opérations diverses', 'Déclaration TVA {{periode}}', [
    { side: 'DEBIT',  compteCode: '4455', compteLibelle: 'État, TVA facturée',                   amountSource: 'TVA' },
    { side: 'CREDIT', compteCode: '3455', compteLibelle: 'État, TVA récupérable',                amountSource: 'HT' /* = TVA déduct. */ },
    { side: 'CREDIT', compteCode: '4456', compteLibelle: 'État, TVA due',                        amountSource: 'NET_A_PAYER' /* = solde */ },
  ]),
  seed('DECLARATION_RAS', 'OD', 'Opérations diverses', 'Reversement RAS {{periode}}', [
    { side: 'DEBIT',  compteCode: '4457', compteLibelle: 'État, retenue à la source à payer',    amountSource: 'RAS' },
    { side: 'CREDIT', compteCode: '5141', compteLibelle: 'Banques',                              amountSource: 'RAS' },
  ]),
  seed('IMMOBILISATION_ACQUISITION', 'ACH', 'Journal des achats', 'Acquisition immobilisation {{ref}}', [
    { side: 'DEBIT',  compteCode: '2332', compteLibelle: 'Matériel et outillage',                amountSource: 'HT'  },
    { side: 'DEBIT',  compteCode: '3455', compteLibelle: 'État, TVA récupérable / immobilisations', amountSource: 'TVA' },
    { side: 'CREDIT', compteCode: '4481', compteLibelle: 'Dettes sur acquisition immobilisations', amountSource: 'TTC' },
  ]),
];

// ──────────────────────────────────────────────────────────────────────────
// Persistance localStorage (3 clés cohérentes avec societe/banque/moa)
// ──────────────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

function resolveAmount(source: AmountSource, amounts: SimulateAmounts): number {
  switch (source) {
    case 'HT':          return amounts.ht ?? 0;
    case 'TVA':         return amounts.tva ?? 0;
    case 'TTC':         return amounts.ttc ?? ((amounts.ht ?? 0) + (amounts.tva ?? 0));
    case 'RAS':         return amounts.ras ?? 0;
    case 'NET_A_PAYER': return amounts.netAPayer ?? ((amounts.ttc ?? ((amounts.ht ?? 0) + (amounts.tva ?? 0))) - (amounts.ras ?? 0) - (amounts.timbre ?? 0));
    case 'TIMBRE':      return amounts.timbre ?? 0;
    case 'CHARGE_PATR': return amounts.chargePatronale ?? 0;
    case 'SALAIRE_NET': return amounts.salaireNet ?? 0;
    case 'IR':          return amounts.ir ?? 0;
    default:            return 0;
  }
}

@Injectable({ providedIn: 'root' })
export class ComptableMappingService {
  private readonly societe = inject(SocieteService);

  private readonly overrides = signal<Record<string, ComptableMapping>>(
    load<Record<string, ComptableMapping>>(OVERRIDES_KEY, {}),
  );
  private readonly created = signal<Record<string, ComptableMapping>>(
    load<Record<string, ComptableMapping>>(CREATED_KEY, {}),
  );
  private readonly deleted = signal<Record<string, true>>(
    load<Record<string, true>>(DELETED_KEY, {}),
  );

  /** Vue agrégée : seeds système + overrides + customs créés − soft-deletes. */
  readonly mappings = computed<readonly ComptableMapping[]>(() => {
    const ov = this.overrides();
    const cr = Object.values(this.created());
    const del = this.deleted();
    const seeds: ComptableMapping[] = SEED_MAPPINGS
      .filter((s) => !del[s.id])
      .map((s) => ov[s.id] ? { ...s, ...ov[s.id], isSystem: true } : s);
    return [...seeds, ...cr.filter((c) => !del[c.id])];
  });

  /** Vue filtrée par société : tenant-specific > __ALL__. */
  mappingsForSociete(societeId: string): readonly ComptableMapping[] {
    const all = this.mappings();
    return all.filter((m) => m.societeId === societeId || m.societeId === '__ALL__');
  }

  /**
   * Résout le mapping actif pour `(societeId, operationType)`.
   * Priorité : (1) custom tenant-spécifique, (2) override seed, (3) seed __ALL__.
   */
  resolveActive(societeId: string | null, op: OperationType): ComptableMapping | null {
    const all = this.mappings();
    const tenant = all.find(
      (m) => m.operationType === op && m.societeId === societeId && m.isActif,
    );
    if (tenant) return tenant;
    const global = all.find((m) => m.operationType === op && m.societeId === '__ALL__' && m.isActif);
    return global ?? null;
  }

  /** Simule l'écriture comptable générée pour une opération avec montants donnés. */
  simulate(op: OperationType, amounts: SimulateAmounts, societeId?: string | null): SimulationResult | null {
    const sid = societeId ?? this.societe.currentSocieteId();
    const mapping = this.resolveActive(sid, op);
    if (!mapping) return null;
    const entries: SimulatedEntry[] = mapping.lignes.map((l) => ({
      side: l.side,
      compteCode: l.compteCode,
      compteLibelle: l.compteLibelle,
      amount: resolveAmount(l.amountSource, amounts),
      source: l.amountSource,
      conditionLibelle: l.conditionLibelle,
    }));
    const totalDebit = entries.filter((e) => e.side === 'DEBIT').reduce((acc, e) => acc + e.amount, 0);
    const totalCredit = entries.filter((e) => e.side === 'CREDIT').reduce((acc, e) => acc + e.amount, 0);
    return {
      mapping,
      entries,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  updateMapping(id: string, patch: Partial<Omit<ComptableMapping, 'id'>>): ComptableMapping | null {
    const current = this.mappings().find((m) => m.id === id);
    if (!current) return null;
    const updated: ComptableMapping = {
      ...current,
      ...patch,
      id: current.id,
      lignes: patch.lignes ?? current.lignes,
    };
    if (current.isSystem) {
      this.overrides.update((cur) => ({ ...cur, [id]: updated }));
      persist(OVERRIDES_KEY, this.overrides());
    } else {
      this.created.update((cur) => ({ ...cur, [id]: updated }));
      persist(CREATED_KEY, this.created());
    }
    return updated;
  }

  createCustomMapping(input: Omit<ComptableMapping, 'id' | 'isSystem'>): ComptableMapping {
    const id = `map-custom-${Date.now().toString(36)}`;
    const created: ComptableMapping = { ...input, id, isSystem: false };
    this.created.update((cur) => ({ ...cur, [id]: created }));
    persist(CREATED_KEY, this.created());
    return created;
  }

  /** Soft delete pour seeds, hard pour customs. */
  deleteMapping(id: string): boolean {
    const current = this.mappings().find((m) => m.id === id);
    if (!current) return false;
    if (current.isSystem) {
      this.deleted.update((cur) => ({ ...cur, [id]: true }));
      persist(DELETED_KEY, this.deleted());
    } else {
      this.created.update((cur) => {
        const next = { ...cur };
        delete next[id];
        return next;
      });
      persist(CREATED_KEY, this.created());
    }
    return true;
  }

  /** Restaure un seed soft-deleted. */
  restoreMapping(id: string): void {
    this.deleted.update((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });
    persist(DELETED_KEY, this.deleted());
  }

  /** Revert un override d'un seed à sa valeur d'origine. */
  revertOverride(id: string): void {
    this.overrides.update((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });
    persist(OVERRIDES_KEY, this.overrides());
  }

  /** Stats agrégées pour la page admin. */
  readonly stats = computed(() => {
    const list = this.mappings();
    return {
      total: list.length,
      system: list.filter((m) => m.isSystem).length,
      custom: list.filter((m) => !m.isSystem).length,
      actifs: list.filter((m) => m.isActif).length,
      overridden: Object.keys(this.overrides()).length,
      deletedSeeds: Object.keys(this.deleted()).length,
    };
  });

  /** QA helper. */
  reset(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(OVERRIDES_KEY);
        localStorage.removeItem(CREATED_KEY);
        localStorage.removeItem(DELETED_KEY);
      } catch { /* noop */ }
    }
    this.overrides.set({});
    this.created.set({});
    this.deleted.set({});
  }
}
