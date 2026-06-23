export type ChantierStatus =
  | 'PROSPECT'
  | 'EN_COURS'
  | 'SUSPENDU'
  | 'TERMINE'
  | 'RECEPTIONNE'
  | 'CLOTURE'
  | 'ANNULE';

export type ChantierType =
  | 'BATIMENT'
  | 'TP'
  | 'VRD'
  | 'GO'
  | 'TCE'
  | 'REHABILITATION';

export type PhaseChantierStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'EN_RETARD';

export type SituationStatus =
  | 'BROUILLON'
  | 'SOUMISE'
  | 'VALIDEE_MOA'
  | 'FACTUREE'
  | 'PAYEE'
  | 'REJETEE';

export interface Chantier {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: ChantierType;
  clientId: string;
  clientName?: string;
  conducteurTravauxId?: string;
  conducteurTravauxName?: string;
  chefChantierId?: string;
  chefChantierName?: string;
  ingenieurName?: string;
  ville: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  /** Rayon géofencing pointage (m). Défaut appliqué côté UI si absent : 200 m. */
  pointageGeofenceM?: number;
  marcheReference?: string;
  dateOffre?: string;
  dateBcClient?: string;
  dateOrdreService?: string;
  dateDebut: string;
  dateFinPrevue: string;
  dateFinReelle?: string;
  dateReception?: string;
  budgetHt: number;
  tvaTaux: number;
  cautionGarantie?: number;
  cautionRestitueeAt?: string;
  avancePercue?: number;
  delaiPaiementJours?: number;
  avancementPercent: number;
  facturesEmisesHt: number;
  encaissementsTtc: number;
  cumulSituationsHt: number;
  marge?: number;
  status: ChantierStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LotChantier {
  id: string;
  chantierId: string;
  code: string;
  parentLotId?: string;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  montantHt?: number;
  avancementPercent: number;
  ordre: number;
}

export interface PhaseChantier {
  id: string;
  chantierId: string;
  lotId?: string;
  code: string;
  designation: string;
  dateDebut: string;
  dateFin: string;
  dependances?: string[];
  responsableId?: string;
  responsableName?: string;
  equipeName?: string;
  quantite?: number;
  unite?: string;
  avancementPercent: number;
  status: PhaseChantierStatus;
}

export interface AvancementLot {
  id: string;
  chantierId: string;
  lotId: string;
  date: string;
  quantiteRealisee: number;
  cumulQuantite: number;
  pourcentage: number;
  saisieParId: string;
  saisieParName?: string;
  notes?: string;
  photos?: string[];
}

export interface SituationLigne {
  id: string;
  lotId: string;
  lotCode?: string;
  designation: string;
  unite?: string;
  quantiteTotale?: number;
  quantitePrecedente?: number;
  quantiteCumulee: number;
  prixUnitaire: number;
  montantHt: number;
}

export interface SituationDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Situation {
  id: string;
  chantierId: string;
  chantierCode?: string;
  chantierName?: string;
  numero: string;
  numeroOrdre: number;
  datePeriodeDebut: string;
  datePeriodeFin: string;
  dateEmission: string;
  cumulPrecedentHt: number;
  cumulCourantHt: number;
  travauxPeriodeHt: number;
  retenueGarantiePercent: number;
  retenueGarantieMontant: number;
  retenueAvancePercent?: number;
  retenueAvanceMontant?: number;
  netAPayerHt: number;
  tvaTaux: number;
  netAPayerTtc: number;
  status: SituationStatus;
  factureId?: string;
  approbateurMOAName?: string;
  approbationDate?: string;
  motifRejet?: string;
  notes?: string;
  pvDocument?: SituationDocument;
  lignes: SituationLigne[];
}

export interface SituationListItem extends Omit<Situation, 'lignes' | 'pvDocument'> {
  delaiAttente?: number;
  nbLignes: number;
}

export type SituationCreate = Omit<
  Situation,
  | 'id'
  | 'numero'
  | 'travauxPeriodeHt'
  | 'retenueGarantieMontant'
  | 'retenueAvanceMontant'
  | 'netAPayerHt'
  | 'netAPayerTtc'
>;

export type SituationUpdate = Partial<SituationCreate>;

export type FactureClientStatus =
  | 'BROUILLON'
  | 'EMISE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'ANNULEE';

export interface FactureClient {
  id: string;
  numero: string;
  chantierId: string;
  chantierCode?: string;
  clientId: string;
  clientName?: string;
  situationId?: string;
  situationNumero?: string;
  dateEmission: string;
  dateEcheance: string;
  totalHt: number;
  tvaTaux: number;
  totalTva: number;
  totalTtc: number;
  status: FactureClientStatus;
  notes?: string;
}

export interface ChantiersState {
  chantiers: Chantier[];
  lots: LotChantier[];
  phases: PhaseChantier[];
}

export type PlanningGranularity = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER';

export type PlanningDisplayMode = 'PHASES' | 'LOTS' | 'BOTH';

export type PlanningPeriodPreset =
  | 'THIS_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'ROLLING_6_MONTHS'
  | 'ALL';