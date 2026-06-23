export type DAStatus = 'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE' | 'CONVERTIE';
export type AOStatus = 'BROUILLON' | 'PUBLIEE' | 'CLOTUREE' | 'ATTRIBUEE' | 'INFRUCTUEUSE' | 'ANNULEE';
export type BCStatus =
  | 'BROUILLON' | 'VALIDE' | 'ENVOYE' | 'ACCUSE_RECEPTION'
  | 'PARTIELLEMENT_LIVRE' | 'LIVRE' | 'FACTURE' | 'CLOTURE' | 'ANNULE';
export type ContratAchatStatus = 'BROUILLON' | 'SIGNE' | 'EN_COURS' | 'ECHU' | 'RESILIE';

export interface DALigne {
  id: string;
  daId: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantite: number;
  uomCode?: string;
  prixEstimeHt?: number;
  totalEstimeHt?: number;
  notes?: string;
}

export interface DemandeAchat {
  id: string;
  numero: string;
  chantierId?: string;
  chantierCode?: string;
  chantierName?: string;
  dateBesoin: string;
  demandeurId: string;
  demandeurName?: string;
  motif?: string;
  status: DAStatus;
  approbateurId?: string;
  approbateurName?: string;
  approbationDate?: string;
  motifRejet?: string;
  bcId?: string;
  bcNumero?: string;
  totalEstimeHt: number;
  notes?: string;
  lignes: DALigne[];
  createdAt: string;
}

export interface DemandeAchatListItem extends Omit<DemandeAchat, 'lignes'> {
  nbLignes: number;
  delaiAttente?: number;
}

export type DemandeAchatCreate = Omit<DemandeAchat, 'id' | 'numero' | 'createdAt'>;
export type DemandeAchatUpdate = Partial<DemandeAchatCreate>;

export interface AOLigne {
  id: string;
  aoId: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantite: number;
  uomCode?: string;
}

export interface AOReponseLigne {
  id: string;
  reponseId: string;
  aoLigneId: string;
  prixUnitaireHt: number;
  totalHt: number;
  delaiSpecifique?: number;
}

export interface AOReponse {
  id: string;
  aoId: string;
  fournisseurId: string;
  fournisseurName?: string;
  dateReponse: string;
  totalHt: number;
  delaiLivraisonJours: number;
  conditionsPaiement?: string;
  notes?: string;
  lignes: AOReponseLigne[];
  retenue: boolean;
  score?: number;
}

export interface AppelOffre {
  id: string;
  numero: string;
  objet: string;
  chantierId?: string;
  chantierCode?: string;
  chantierName?: string;
  fournisseurInvitesIds: string[];
  fournisseurInvitesNames?: string[];
  datePublication?: string;
  dateLimiteDepot: string;
  status: AOStatus;
  fournisseurAttribueId?: string;
  fournisseurAttribueName?: string;
  bcGenereId?: string;
  bcGenereNumero?: string;
  totalAttribueHt?: number;
  notes?: string;
  lignes: AOLigne[];
  reponses: AOReponse[];
  createdAt: string;
}

export interface AppelOffreListItem extends Omit<AppelOffre, 'lignes' | 'reponses' | 'fournisseurInvitesIds'> {
  nbLignes: number;
  nbInvites: number;
  nbReponses: number;
}

export type AppelOffreCreate = Omit<AppelOffre, 'id' | 'numero' | 'createdAt'>;
export type AppelOffreUpdate = Partial<AppelOffreCreate>;

/** Scoring comparatif AO (M-ACH-02). */
export interface ScoringAO {
  aoId: string;
  fournisseurId: string;
  fournisseurName?: string;
  reponseId: string;
  offre: AOReponseLigne[];
  scoreFinal: number;
  scoreDetail: {
    prix: number;
    delai: number;
    qualite: number;
    historique: number;
    art187: number;
  };
  recommandation: 'TOP' | 'OK' | 'A_VERIFIER' | 'A_EXCLURE';
  raisonRecommandation: string;
}

export interface BCLigne {
  id: string;
  bcId: string;
  articleId: string;
  articleCode?: string;
  articleName?: string;
  quantite: number;
  quantiteLivree: number;
  quantiteFacturee: number;
  uomCode?: string;
  prixUnitaireHt: number;
  totalHt: number;
  notes?: string;
}

export interface BonCommande {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseurName?: string;
  chantierId?: string;
  chantierCode?: string;
  chantierName?: string;
  daId?: string;
  daNumero?: string;
  aoId?: string;
  aoNumero?: string;
  contratId?: string;
  contratNumero?: string;
  rubrique?: 'MATERIAUX' | 'SOUS_TRAITANCE' | 'LOCATION_MATERIEL' | 'CARBURANT' | 'FRAIS_GENERAUX';
  dateCreation: string;
  dateLivraisonPrevue: string;
  conditionsPaiement: string;
  modeReglement?: 'VIREMENT' | 'CHEQUE' | 'EFFET' | 'ESPECES';
  totalHt: number;
  tvaTaux: number;
  totalTtc: number;
  status: BCStatus;
  validateurId?: string;
  validateurName?: string;
  validationDate?: string;
  totalLivreHt: number;
  totalFactureHt: number;
  notes?: string;
  lignes: BCLigne[];
}

export interface BonCommandeListItem extends Omit<BonCommande, 'lignes'> {
  nbLignes: number;
  totalLivrePercent: number;
  enRetardLivraison: boolean;
}

export type BonCommandeCreate = Omit<BonCommande, 'id' | 'numero'>;
export type BonCommandeUpdate = Partial<BonCommandeCreate>;

export interface ContratAchat {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseurName?: string;
  type: 'CADRE' | 'ANNUEL' | 'PONCTUEL';
  objet: string;
  dateDebut: string;
  dateFin: string;
  montantPlafondHt?: number;
  cumulBcEmisHt: number;
  conditionsPaiement: string;
  status: ContratAchatStatus;
  documents?: { name: string; url: string }[];
  notes?: string;
  createdAt: string;
}

export interface ContratAchatListItem extends ContratAchat {
  consommationPercent?: number;
  joursRestants?: number;
}

export type ContratAchatCreate = Omit<ContratAchat, 'id' | 'numero' | 'createdAt'>;
export type ContratAchatUpdate = Partial<ContratAchatCreate>;

export interface Fournisseur {
  id: string;
  code: string;
  raisonSociale: string;
  ice?: string;
  rc?: string;
  patente?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  contactPrincipalNom?: string;
  contactPrincipalTel?: string;
  contactPrincipalEmail?: string;
  conditionsPaiementParDefaut: string;
  modeReglementParDefaut?: string;
  delaiLivraisonMoyen?: number;
  rib?: string;
  banque?: string;
  categories: string[];
  notation?: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  notes?: string;
  /** Régime auto-entrepreneur : autoliquidation TVA + RAS spécifique (démo achats). */
  regimeAutoEntrepreneur?: boolean;
  createdAt: string;
}

export interface FournisseurListItem extends Fournisseur {
  nbBcAnnuels?: number;
  montantBcAnnuel?: number;
}

export type FournisseurCreate = Omit<Fournisseur, 'id' | 'code' | 'createdAt'>;
export type FournisseurUpdate = Partial<FournisseurCreate>;

/** Prix négocié article × fournisseur (B-ACH-05 / M-ACH-05). */
export interface CatalogueFournisseurLigne {
  id: string;
  fournisseurId: string;
  articleId: string;
  refFournisseur?: string;
  designation: string;
  prixUnitaireHt: number;
  uom?: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CatalogueFournisseurLigneCreate = Omit<
  CatalogueFournisseurLigne,
  'id' | 'createdAt' | 'updatedAt'
>;
export type CatalogueFournisseurLigneUpdate = Partial<CatalogueFournisseurLigneCreate>;

/** Attestation administrative fournisseur (B-ACH-06). */
export type AttestationFournisseurType =
  | 'CNSS'
  | 'FISCALE'
  | 'AMO'
  | 'RC'
  | 'IF'
  | 'ICE'
  | 'PATENTE'
  | 'RIB';

export type AttestationFournisseurStatus = 'VALIDE' | 'EXPIRE_BIENTOT' | 'EXPIRE';

export interface AttestationFournisseur {
  id: string;
  partnerId: string;
  type: AttestationFournisseurType;
  dateEmission: string;
  dateExpiration: string;
  scanUrl?: string;
  status: AttestationFournisseurStatus;
  createdAt: string;
  updatedAt: string;
}

export type AttestationFournisseurCreate = Omit<
  AttestationFournisseur,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;
export type AttestationFournisseurUpdate = Partial<AttestationFournisseurCreate>;

export interface AttestationTypeStatus {
  type: AttestationFournisseurType;
  status: AttestationFournisseurStatus;
  attestationId?: string;
  dateExpiration?: string;
  present: boolean;
}

export interface PartnerAttestationsStatus {
  partnerId: string;
  chips: AttestationTypeStatus[];
  reglementBloque: boolean;
}

export interface AchatsState {
  demandes: DemandeAchat[];
  appelsOffres: AppelOffre[];
  bonsCommande: BonCommande[];
  contrats: ContratAchat[];
  fournisseurs: Fournisseur[];
}

export * from './matching.models';
