export type ConsultationStatus =
  | 'BROUILLON'
  | 'EN_CHIFFRAGE'
  | 'EN_VALIDATION'
  | 'TERMINE'
  | 'A_VALIDER'
  | 'VALIDEE'
  | 'CONVERTIE'
  | 'ANNULEE';

export type NoeudType = 'LOT' | 'SOUS_LOT' | 'POSTE';
export type PosteMode = 'FOURNI' | 'DECOMPOSE';
export type ItemLinkStatus = 'LINKED' | 'TO_CREATE';
export type ComposantType =
  | 'MATERIAU'
  | 'SERVICE'
  | 'LOCATION'
  | 'MO'
  | 'SOUS_TRAITANCE';

export interface ConsultationComposant {
  id: string;
  noeudId: string;
  type: ComposantType;
  designation: string;
  unite?: string | null;
  rendement?: number | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
  total?: number | null;
  itemId?: string | null;
  itemCode?: string | null;
  itemName?: string | null;
  itemStatus?: ItemLinkStatus | null;
  ordre: number;
  source?: Record<string, unknown> | null;
}

export interface ConsultationNoeud {
  id: string;
  consultationId: string;
  parentId?: string | null;
  type: NoeudType;
  code?: string | null;
  libelle: string;
  unite?: string | null;
  quantite?: number | null;
  descriptif?: string | null;
  ordre: number;
  mode?: PosteMode | null;
  deboursSec?: number | null;
  fraisGenerauxPercent?: number | null;
  margePercent?: number | null;
  prixVenteHt?: number | null;
  itemId?: string | null;
  itemCode?: string | null;
  itemName?: string | null;
  itemStatus?: ItemLinkStatus | null;
  enfants?: ConsultationNoeud[];
  composants?: ConsultationComposant[];
}

export interface Consultation {
  id: string;
  tenantId?: string;
  numero: string;
  objet: string;
  chantierId?: string | null;
  chantierCode?: string | null;
  chantierName?: string | null;
  cpsDocumentId?: string | null;
  bordereauDocumentId?: string | null;
  status: ConsultationStatus;
  currentStep?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  arbre?: ConsultationNoeud[];
}

export interface CatalogCandidate {
  itemId: string;
  code?: string | null;
  name: string;
  unite?: string | null;
  articleType?: string | null;
  score?: number | null;
}

export interface ConsultationCreate {
  objet: string;
  numero?: string;
  chantierId?: string;
  chantierCode?: string;
  chantierName?: string;
  cpsDocumentId?: string;
  bordereauDocumentId?: string;
  notes?: string;
}

export type ConsultationUpdate = Partial<ConsultationCreate>;

export interface NoeudCreate {
  type: NoeudType | string;
  parentId?: string | null;
  code?: string;
  libelle: string;
  unite?: string;
  quantite?: number;
  descriptif?: string;
  ordre?: number;
  mode?: PosteMode | string;
}

export interface NoeudUpdate {
  code?: string;
  libelle?: string;
  unite?: string;
  quantite?: number;
  descriptif?: string;
  ordre?: number;
  mode?: PosteMode | string;
}

export interface PostePricing {
  fraisGenerauxPercent?: number;
  margePercent?: number;
}

export interface ComposantInput {
  type?: ComposantType | string;
  designation: string;
  unite?: string;
  rendement?: number;
  quantite?: number;
  prixUnitaire?: number;
  ordre?: number;
}

export interface LinkItem {
  itemId: string;
  itemCode?: string;
  itemName?: string;
}

export interface CreateItem {
  name?: string;
  code?: string;
  description?: string;
  unite?: string;
  articleType?: string;
  prixUnitaire?: number;
}

export interface ImportTree {
  arbre: unknown[];
}

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  BROUILLON: 'Brouillon',
  EN_CHIFFRAGE: 'En chiffrage',
  EN_VALIDATION: 'En validation',
  TERMINE: 'Terminé',
  A_VALIDER: 'À valider',
  VALIDEE: 'Validée',
  CONVERTIE: 'Convertie',
  ANNULEE: 'Annulée',
};
