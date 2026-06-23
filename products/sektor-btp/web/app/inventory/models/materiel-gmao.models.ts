/** GMAO matériel — Task 05 Round 2 (M-MAT-01..07). */

export type DeclencheurMaintenance = 'HEURES' | 'KILOMETRES' | 'CALENDAIRE';

export interface PlanMaintenance {
  id: string;
  engineId: string;
  typeIntervention: string;
  declencheur: DeclencheurMaintenance;
  seuil: number;
  dernierReleve: number;
  prochainSeuil: number;
  alerteJ: number;
  /** Prochaine échéance calendaire (ISO date) — utilisée pour alertes semaine. */
  prochaineEcheanceIso?: string;
}

export interface PieceOT {
  id: string;
  reference: string;
  designation: string;
  quantity: number;
  unitPrice: number;
}

export type OrdreTravailType = 'PREVENTIF' | 'CORRECTIF' | 'AMELIORATION';

export type OrdreTravailStatus = 'OUVERT' | 'EN_COURS' | 'CLOS' | 'ANNULE';

export interface OrdreTravail {
  id: string;
  numero: string;
  engineId: string;
  type: OrdreTravailType;
  declencheurPlanId?: string;
  description: string;
  dateOuverture: string;
  dateClôture?: string;
  techniciens: string[];
  piecesConsommees: PieceOT[];
  coutPieces: number;
  coutMO: number;
  coutTotal: number;
  duree: number;
  status: OrdreTravailStatus;
  prochainEntretien?: string;
}

export type CarburantType = 'GAZOLE' | 'ESSENCE' | 'ADBLUE' | 'AUTRE';

export interface CarnetCarburant {
  id: string;
  engineId: string;
  capaciteReservoir: number;
  typeCarburant: CarburantType;
  consommationCible: number;
  ouverturePar: string;
  dateOuverture: string;
}

export interface PleinCarburant {
  id: string;
  carnetId: string;
  engineId: string;
  date: string;
  litres: number;
  prixLitre: number;
  total: number;
  jaugeDebut: number;
  jaugeFin: number;
  chauffeurId?: string;
  chantierId?: string;
  fournisseurId?: string;
  pieceJustificative?: string;
  anomalie?: boolean;
}

export type ContratLocationStatus = 'BROUILLON' | 'ACTIF' | 'EXPIRE' | 'PROLONGE' | 'CLOS';

export interface ContratLocation {
  id: string;
  numero: string;
  loueurId: string;
  loueurName?: string;
  engineDescription: string;
  chantierId: string;
  chantierRef?: string;
  dateDebut: string;
  dateFin: string;
  tarif: { unite: 'JOUR' | 'SEMAINE' | 'MOIS' | 'HEURE'; montant: number };
  montantTotalEstime: number;
  cautionVersee?: number;
  status: ContratLocationStatus;
  documents: string[];
}

export type EtatContradictoireType = 'ENTREE' | 'SORTIE';

export interface EtatContradictoire {
  id: string;
  contratId: string;
  type: EtatContradictoireType;
  date: string;
  heuresCompteur?: number;
  kilometrage?: number;
  niveauCarburantPct?: number;
  photos: string[];
  signataireInterne?: string;
  signataireLoueur?: string;
  observations?: string;
}

export type ControleReglementaireType = 'VGP' | 'CT' | 'ETALONNAGE' | 'ASSURANCE' | 'CARTE_GRISE';

export interface ControleReglementaire {
  id: string;
  engineId: string;
  type: ControleReglementaireType;
  libelle: string;
  dateDernier: string;
  dateExpiration: string;
  bloqueAffectationSiExpire: boolean;
}

export interface PointageEngin {
  id: string;
  engineId: string;
  chantierId: string;
  chantierRef?: string;
  date: string;
  heuresFonctionnement: number;
  operateurId?: string;
  commentaire?: string;
}
