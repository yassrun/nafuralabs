// ─── ENUMS ────────────────────────────────────────────────────────────────────

import type { Emplacement } from './emplacement.model';

/** Dépôt / entrepôt / chantier / transit — vocabulaire BTP (spec §05). */
export type LocationType = 'DEPOT' | 'CHANTIER' | 'ENTREPOT' | 'TRANSIT' | 'VIRTUEL';
export type ArticleType = 'MATERIAU' | 'CONSOMMABLE' | 'ENGIN' | 'OUTILLAGE';
export type TxType = 'RECEPTION' | 'TRANSFERT' | 'RETOUR' | 'INVENTAIRE' | 'PERTE' | 'SORTIE';
export type MaterielStatus = 'DISPONIBLE' | 'AFFECTE' | 'MAINTENANCE' | 'HORS_SERVICE';
export type LocationExterneStatus = 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

// ─── RÉFÉRENTIELS ─────────────────────────────────────────────────────────────

export interface UomCategory {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  uomCategoryId: string;
  isActive: boolean;
}

export interface FamilleArticle {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface TypeArticle {
  id: string;
  code: string;
  name: string;
  articleType: ArticleType;
  isActive: boolean;
}

export interface MotifMouvement {
  id: string;
  code: string;
  name: string;
  txType: TxType;
  isActive: boolean;
}

export interface CostingMethod {
  id: string;
  code: string;
  name: string;
  method: 'AVCO' | 'FIFO' | 'STD';
  description?: string;
  isDefault?: boolean;
  isActive: boolean;
}

// ─── LOCATIONS ────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  projectRef?: string;
  parentId?: string;
  isActive: boolean;
  address?: string;
  /** Ville (libellé métier magasin / chantier). */
  ville?: string;
  latitude?: number;
  longitude?: number;
  /** Capacité de stockage approximative (BTP). */
  capaciteM3?: number;
  capaciteTonnes?: number;
  responsableId?: string;
  responsableNom?: string;
  /** Référentiel chantier (id maître) si rattaché. */
  chantierId?: string;
  notes?: string;
  emplacements?: Emplacement[];
  /**
   * Chantier « pilotage budget » (id interne budget, ex. ch-2026-001) pour
   * rattacher les sorties stock au bon budget sans ambiguïté.
   */
  budgetChantierId?: string;
}

export type ChantierStatus = 'EN_COURS' | 'TERMINE' | 'SUSPENDU';

export interface Chantier {
  id: string;
  code: string;
  name: string;
  client?: string;
  projectRef: string;
  status: ChantierStatus;
  isActive: boolean;
}

export interface Fournisseur {
  id: string;
  code: string;
  name: string;
  ice?: string;
  isActive: boolean;
}

// ─── CATALOGUE ────────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  code: string;
  name: string;
  description?: string;
  familleId: string;
  familleName?: string;
  typeArticleId: string;
  typeArticleName?: string;
  uomId: string;
  uomCode?: string;
  articleType: ArticleType;
  stockMin?: number;
  stockMax?: number;
  prixUnitaire?: number;
  /** Dernier prix d’achat connu (dernière entrée). */
  prixAchatDernier?: number;
  /** Prix moyen pondéré (valorisation stock). */
  pmp?: number;
  delaiReapproJours?: number;
  fournisseurPrefereIds?: string[];
  uomSecondaireId?: string;
  uomSecondaireCode?: string;
  /** Ex. 1 sac = 50 kg : facteur secondaire → primaire. */
  conversionFactor?: number;
  isPerissable?: boolean;
  isSerialise?: boolean;
  /**
   * Code rubrique budget (ex. MATERIAUX) — prime sur l’heuristique V1 (Task 5.7 V2).
   */
  posteBudgetId?: string;
  /** Emplacements autorisés dans les dépôts (M-STK-06). */
  emplacementsPossiblesIds?: string[];
  emplacementParDefautId?: string;
  isActive: boolean;
}

export interface CatalogueMateriel {
  id: string;
  code: string;
  name: string;
  description?: string;
  familleId?: string;
  familleName?: string;
  marque?: string;
  modele?: string;
  numeroSerie: string;
  anneeMiseEnService?: number;
  puissanceCapacite?: string;
  status: MaterielStatus;
  dateDernierEntretien?: string;
  prochaineMaintenance?: string;
  notesMaintenance?: string;
  chantierActuelId?: string;
  chantierActuelName?: string;
  isActive: boolean;
}

// ─── OPÉRATIONS ───────────────────────────────────────────────────────────────

export interface InventoryTxLine {
  id: string;
  txId: string;
  lineNumber: number;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantity: number;
  uomId: string;
  uomCode?: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  /** Ligne BC d’origine — prioritaire pour le 3-way matching (Achats). */
  bcLigneId?: string;
  emplacementId?: string;
  emplacementCode?: string;
  lotStockId?: string;
  numeroLot?: string;
  datePeremption?: string;
}

export interface InventaireLine extends InventoryTxLine {
  theoreticalQty: number;
  countedQty: number;
  variance: number;
}

export interface InventaireTx extends Omit<InventoryTx, 'lines' | 'txType'> {
  txType: 'INVENTAIRE';
  lines: InventaireLine[];
  totalVariance: number;
}

export interface InventoryTx {
  id: string;
  txNumber: string;
  txType: TxType;
  txDate: string;
  fournisseurId?: string;
  fournisseurName?: string;
  sourceLocationId?: string;
  sourceLocationName?: string;
  destLocationId?: string;
  destLocationName?: string;
  /** Référence chantier (Location CHANTIER) — saisie via lookup côté UI */
  chantierLocationId?: string;
  /** Chantier budget (id `ChantierBudget`, ex. ch-2026-001) — sorties stock. */
  chantierBudgetId?: string;
  chantierRef?: string;
  phaseRef?: string;
  motifId?: string;
  motifName?: string;
  reference?: string;
  status: string;
  notes?: string;
  /** Bon de commande achats — liaison réception ↔ BC (3-way matching). */
  bcId?: string;
  bcNumero?: string;
  lines: InventoryTxLine[];
}

// ─── MATÉRIEL & ENGINS ───────────────────────────────────────────────────────

export interface AffectationChantier {
  id: string;
  materielId: string;
  materielName?: string;
  locationId: string;
  locationName?: string;
  chantierRef: string;
  dateDebut: string;
  dateFin?: string;
  status: MaterielStatus;
  notes?: string;
}

export interface LocationExterne {
  id: string;
  reference: string;
  fournisseur: string;
  materielDescription: string;
  locationId: string;
  locationName?: string;
  chantierRef?: string;
  dateDebut: string;
  dateFin?: string;
  prixJournalier?: number;
  status: LocationExterneStatus;
  notes?: string;
}

// ─── STOCK ────────────────────────────────────────────────────────────────────

export interface StockBalance {
  id: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  familleId?: string;
  familleName?: string;
  locationId: string;
  locationName?: string;
  locationType?: LocationType;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitPrice?: number;
  totalValue?: number;
  stockMin?: number;
  lastCountDate?: string;
}

export type AlertUrgency = 'CRITIQUE' | 'EN_ALERTE';

export interface StockAlert {
  id: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  familleId?: string;
  familleName?: string;
  locationId: string;
  locationName?: string;
  locationType?: LocationType;
  currentQty: number;
  minQty: number;
  shortage: number;
  urgency: AlertUrgency;
  lastReceptionDate?: string;
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export * from './materiel-gmao.models';
export * from './reservation-stock.model';
export * from './emplacement.model';
export * from './lot-stock.model';
