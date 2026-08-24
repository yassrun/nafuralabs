/**
 * Les quatre rubriques de deboursé d'un noeud, plus la part non ventilée.
 *
 * Ce sont les quatre types de composant du DPU, sous leurs noms d'origine : deux jeux de noms
 * pour une meme chose est ce qui faisait perdre la décomposition entre l'étude et le chantier.
 *
 * `NON_VENTILE` n'est pas une cinquieme nature de coût : c'est la part qu'on n'a pas su
 * décomposer (poste estimé, poste décomposé sans sous-détail). Elle s'affiche quand elle existe
 * et ne se saisit jamais.
 */
export type BudgetRubrique =
  | 'MATIERE'
  | 'MAIN_DOEUVRE'
  | 'MATERIEL'
  | 'SOUS_TRAITANCE'
  | 'NON_VENTILE';

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

/**
 * Une révision porte désormais sur un **noeud**, pas sur le chantier : le budget par rubrique
 * agrégé au chantier n'existe plus comme stockage, il se dérive de l'arbre.
 */
export interface BudgetRevisionDraft {
  chantierId: string;
  noeudId: string;
  motif: string;
  pieceName?: string;
  lignes: Array<{
    rubrique: BudgetRubrique;
    reviseHt: number;
  }>;
}

/** Les rubriques dites en clair — c'est ce que lit le conducteur de travaux. */
export const BUDGET_RUBRIQUES: Array<{ key: BudgetRubrique; label: string; lot: string }> = [
  { key: 'MATIERE', label: 'Matière', lot: '' },
  { key: 'MAIN_DOEUVRE', label: "Main d'œuvre", lot: '' },
  { key: 'MATERIEL', label: 'Matériel', lot: '' },
  { key: 'SOUS_TRAITANCE', label: 'Sous-traitance', lot: '' },
  { key: 'NON_VENTILE', label: 'Non ventilé', lot: '' },
];

/** Les quatre rubriques saisissables. Le non ventilé se constate, il ne se saisit pas. */
export const BUDGET_RUBRIQUES_SAISISSABLES = BUDGET_RUBRIQUES.filter(
  (rubrique) => rubrique.key !== 'NON_VENTILE',
);

/** D'où vient le déboursé d'un noeud : copié de l'étude, ou saisi sur un noeud interne. */
export type OrigineDebourse = 'DECOMPOSE' | 'FORFAIT' | 'ESTIME' | 'SAISI';

export type NatureNoeud = 'VENDU' | 'INTERNE';

/** Les memes chiffres au poste, au lot et au chantier — une seule règle de remontée. */
export interface BudgetNoeudTotaux {
  venduHt: number;
  deboursePrevuHt: number;
  debourseReviseHt: number;
  debourseReelHt: number;
  margePrevueHt: number;
  /** `null` sur un noeud interne : un pourcentage de marge sur un vendu nul ne veut rien dire. */
  margePrevuePercent: number | null;
  margeReelleHt: number;
  margeReellePercent: number | null;
  avancementPercent: number;
  /** Déboursé prévu de ce qui est fait : avancement x prévu. */
  debourseFaitHt: number;
  /** Déboursé fait − déboursé réel. Négatif = on dépense plus que ce qu'on produit. */
  ecartHt: number;
}

export interface BudgetNoeudRubrique {
  rubrique: BudgetRubrique;
  label: string;
  prevuHt: number;
  reviseHt: number;
  reelHt: number;
  ecartHt: number;
}

export interface BudgetNoeud {
  id: string;
  type: 'LOT' | 'SOUS_LOT' | 'POSTE';
  code: string;
  designation: string;
  nature: NatureNoeud;
  origine?: OrigineDebourse;
  /** Déboursé déduit d'un prix de vente : signalé à l'écran, ni corrigé ni caché. */
  nonFiable: boolean;
  unite?: string;
  quantitePrevue?: number;
  quantiteFaite?: number;
  totaux: BudgetNoeudTotaux;
  rubriques: BudgetNoeudRubrique[];
  enfants: BudgetNoeud[];
}

export interface BudgetArbre {
  chantierId: string;
  code: string;
  name: string;
  client: string;
  lots: BudgetNoeud[];
  totaux: BudgetNoeudTotaux;
  rubriques: BudgetNoeudRubrique[];
}

/** Saisie ou révision du déboursé d'un noeud, rubrique par rubrique. */
export interface DebourseNoeudDraft {
  noeudId: string;
  rubriques: Array<{ rubrique: BudgetRubrique; montantHt: number }>;
}

/** Une imputation de coût réel : un noeud, une rubrique, un montant, une date. Rien d'autre. */
export interface CoutReelDraft {
  /** Absent : la dépense tombe sur « Frais de chantier » et reste ré-imputable. */
  noeudId?: string;
  rubrique: BudgetRubrique;
  montantHt: number;
  dateCout?: string;
  libelle?: string;
  source?: string;
}
