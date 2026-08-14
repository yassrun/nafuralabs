export type BudgetRubrique =
  | 'MATERIAUX'
  | 'MO'
  | 'SOUS_TRAITANCE'
  | 'LOCATION_MATERIEL'
  | 'CARBURANT'
  | 'FRAIS_GENERAUX'
  | 'IMPREVUS';

export type ChantierBudgetStatus = 'EN_COURS' | 'TERMINE' | 'SUSPENDU';

export interface BudgetLineItemDrilldown {
  id: string;
  label: string;
  unite: string;
  qteBudget: number;
  qteCommande: number;
  qteLivree: number;
  qteConsommee: number;
  montantRealiseHt: number;
  /** Référentiel article stock (drill sorties / poste). */
  articleId?: string;
  /** Quantités / montants issus uniquement des sorties stock (M-STK-04). */
  qteRealiseeStock?: number;
  montantRealiseMatiereStockHt?: number;
}

export interface BudgetLigne {
  rubrique: BudgetRubrique;
  label: string;
  initialHt: number;
  reviseHt: number;
  engageHt: number;
  realiseHt: number;
  /** Réalisé matière comptabilisé depuis les sorties stock (M-STK-04). */
  realiseMatiereStockHt?: number;
  resteHt: number;
  ecartHt: number;
  ecartPercent: number;
  lot: string;
  drilldown?: BudgetLineItemDrilldown[];
}

export interface BudgetRevision {
  id: string;
  date: string;
  ancienBudgetTotal: number;
  nouveauBudgetTotal: number;
  motif: string;
  pieceName?: string;
}

export interface BudgetEngagement {
  id: string;
  reference: string;
  fournisseur: string;
  rubrique: BudgetRubrique;
  montantHt: number;
  statut: 'VALIDE' | 'EN_COURS' | 'LIVRE_PARTIEL';
  date: string;
}

export interface BudgetMonthlyPoint {
  month: string;
  budgetHt: number;
  engageHt: number;
  realiseHt: number;
}

export interface ChantierBudget {
  id: string;
  code: string;
  name: string;
  client: string;
  status: ChantierBudgetStatus;
  budgetVenteHt: number;
  situationsNetApayerHt: number;
  budgetInitialHt: number;
  budgetReviseHt: number;
  engageHt: number;
  realiseHt: number;
  resteAEngagerHt: number;
  resteAExecuterHt: number;
  consommationPercent: number;
  margeProjeteePercent: number;
  alerte: boolean;
  alertMessage?: string;
  lignes: BudgetLigne[];
  engagements: BudgetEngagement[];
  revisions: BudgetRevision[];
  evolutionMensuelle: BudgetMonthlyPoint[];
}

export interface BudgetFilters {
  statuses: ChantierBudgetStatus[];
  consommationRange: 'TOUS' | 'LOW' | 'MID' | 'HIGH' | 'OVER';
  margeRange: 'TOUS' | 'NEGATIVE' | 'LOW' | 'HEALTHY';
  enAlerte: boolean;
}

export interface BudgetRevisionDraft {
  chantierId: string;
  motif: string;
  pieceName?: string;
  lignes: Array<{
    rubrique: BudgetRubrique;
    reviseHt: number;
  }>;
}

export const BUDGET_RUBRIQUES: Array<{ key: BudgetRubrique; label: string; lot: string }> = [
  { key: 'MATERIAUX', label: 'Materiaux', lot: 'Gros oeuvre' },
  { key: 'MO', label: 'Main d oeuvre', lot: 'Execution' },
  { key: 'SOUS_TRAITANCE', label: 'Sous-traitance', lot: 'Second oeuvre' },
  { key: 'LOCATION_MATERIEL', label: 'Location materiel', lot: 'Materiel' },
  { key: 'CARBURANT', label: 'Carburant', lot: 'Logistique' },
  { key: 'FRAIS_GENERAUX', label: 'Frais generaux', lot: 'Support' },
  { key: 'IMPREVUS', label: 'Imprevus', lot: 'Pilotage' },
];
