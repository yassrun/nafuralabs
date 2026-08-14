import type { ListQuery } from '@platform/lib/anatomy/types';

export type ChantierStatus = 'EN_COURS' | 'TERMINE' | 'SUSPENDU';
export type LotStatus = 'EN_COURS' | 'TERMINE';
export type AvancementStatus = 'BROUILLON' | 'VALIDE';

export interface EmployeLookup {
  id: string;
  name: string;
  role: string;
  preferredChantierIds: string[];
  isAdmin?: boolean;
}

export interface ChantierAvancement {
  id: string;
  code: string;
  name: string;
  client: string;
  budgetHt: number;
  status: ChantierStatus;
  startDate: string;
  endDate: string;
  conducteurId: string;
  chefChantierId: string;
  avancementPercent: number;
  isActive: boolean;
}

export interface LotChantier {
  id: string;
  chantierId: string;
  code: string;
  designation: string;
  parentLotId?: string;
  unite: string;
  quantite: number;
  prixUnitaireHt?: number;
  montantHt?: number;
  cumulQuantite: number;
  avancementPercent: number;
  status: LotStatus;
  ordre: number;
}

export interface PosteSaisieContext {
  id: string;
  lotId: string;
  code: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaireHt: number;
  montantHt: number;
}

export type SaisieLineKind = 'poste' | 'lot';

export interface SaisieLineDefinition {
  key: string;
  kind: SaisieLineKind;
  lot: LotChantier;
  poste?: PosteSaisieContext;
  parentLot?: LotChantier;
  weight: number;
}

export interface AvancementPhoto {
  id: string;
  name: string;
  url: string;
  capturedAt: string;
  /** Pending file to upload after avancement is persisted. */
  file?: File;
}

export interface AvancementLot {
  id: string;
  chantierId: string;
  chantierCode: string;
  chantierName: string;
  lotId: string;
  lotCode: string;
  lotDesignation: string;
  posteId?: string;
  posteCode?: string;
  posteDesignation?: string;
  date: string;
  quantiteRealisee: number;
  cumulQuantite: number;
  pourcentage: number;
  saisieParId: string;
  saisieParName: string;
  notes?: string;
  photos: AvancementPhoto[];
  status: AvancementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AvancementListItem extends AvancementLot {
  photosCount: number;
}

export interface AvancementQuery extends ListQuery {
  chantierId?: string[] | string;
  lotId?: string[] | string;
  dateFrom?: string;
  dateTo?: string;
  saisieParId?: string;
  avecPhotos?: boolean;
  enRetard?: boolean;
  mesSaisies?: boolean;
}

export interface LotSaisieDraft {
  lineKey: string;
  lotId: string;
  posteId?: string;
  quantitePeriode: number | null;
  notes: string;
  photos: AvancementPhoto[];
}

export interface SaisieLineViewModel {
  lineKey: string;
  kind: SaisieLineKind;
  lot: LotChantier;
  poste?: PosteSaisieContext;
  parentLot?: LotChantier;
  breadcrumb: string;
  unite: string;
  quantiteReference: number;
  lastCumul: number;
  quantitePeriode: number | null;
  nouveauCumul: number;
  previousPercent: number;
  newPercent: number;
  deltaPercent: number;
  warning?: string;
  notes: string;
  photos: AvancementPhoto[];
}

/** @deprecated Use SaisieLineViewModel */
export interface LotSaisieViewModel {
  lot: LotChantier;
  lastCumul: number;
  quantitePeriode: number | null;
  nouveauCumul: number;
  previousPercent: number;
  newPercent: number;
  deltaPercent: number;
  warning?: string;
  notes: string;
  photos: AvancementPhoto[];
}

export interface AvancementSaisieSummary {
  lotsCount: number;
  chantierBeforePercent: number;
  chantierAfterPercent: number;
  chantierDeltaPercent: number;
}

export interface AvancementPersistInput {
  chantierId: string;
  date: string;
  status: AvancementStatus;
  saisieParId: string;
  entries: Array<{
    lotId: string;
    posteId?: string;
    quantiteRealisee: number;
    notes?: string;
    photos: AvancementPhoto[];
  }>;
}

export interface AvancementUpdateInput {
  date?: string;
  quantiteRealisee?: number;
  notes?: string;
  photos?: AvancementPhoto[];
  status?: AvancementStatus;
}