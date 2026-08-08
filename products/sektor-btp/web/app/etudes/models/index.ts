// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type CategoryOuvrage =
  | 'TERRASSEMENT'
  | 'GO'
  | 'CHARPENTE'
  | 'ETANCHEITE'
  | 'CLOISON'
  | 'REVETEMENT'
  | 'MENUISERIE'
  | 'ELECTRICITE'
  | 'PLOMBERIE'
  | 'CLIM'
  | 'PEINTURE'
  | 'VRD'
  | 'AUTRE';

export type ComposantType = 'MATERIAU' | 'SOUS_TRAITANCE' | 'LOCATION' | 'OUTILLAGE' | 'MO';

export type DevisStatus =
  | 'BROUILLON'
  | 'EMIS'
  | 'NEGOCIATION'
  | 'APPROUVE'
  | 'PERDU'
  | 'ANNULE'
  | 'EXPIRE';

export type DevisLigneType = 'CHAPITRE' | 'OUVRAGE' | 'TEXTE';

export type MetreStatus = 'BROUILLON' | 'TERMINE';

/** DPU — composantes déboursé sec (chiffrage CCAG-T / entreprise) */
export type DpuComposantType =
  | 'MATIERE'
  | 'MAIN_DOEUVRE'
  | 'MATERIEL'
  | 'SOUS_TRAITANCE';

/** Origine du prix d’un composant DPU (aligné sur `SourcePrix` backend). */
export type SourcePrixComposant = 'MANUEL' | 'CATALOGUE' | 'CONSULTE' | 'BIBLIOTHEQUE' | string;

export interface ComposantDPU {
  id: string;
  type: DpuComposantType;
  articleOuPosteId: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total: number;
  /** MANUEL par défaut ; CONSULTE quand un prix offre/catalogue a été appliqué. */
  sourcePrix?: SourcePrixComposant | null;
  offreFournisseurId?: string | null;
}

export interface DpuHistoriqueEntry {
  id: string;
  savedAt: string;
  composants: ComposantDPU[];
  fraisGenerauxPercent: number;
  margePercent: number;
  prixVenteHt: number;
}

export interface PrixDPU {
  id?: string;
  articleId?: string;
  dpgfNoeudId?: string;
  ouvrageId?: string;
  unite?: string;
  composants: ComposantDPU[];
  deboursSec: number;
  fraisGenerauxPercent: number;
  margeBeneficiairePercent: number;
  prixVenteHT: number;
  prixVenteTTC: number;
  tvaTaux: number;
  version?: number;
  updatedAt?: string;
}

export type NoeudDPGFType = 'LOT' | 'SOUS_LOT' | 'ARTICLE';
export type NoeudDPGFMode = 'FOURNI' | 'DECOMPOSE';

export interface NoeudDPGF {
  id: string;
  type: NoeudDPGFType;
  code: string;
  libelle: string;
  enfants?: NoeudDPGF[];
  articleId?: string;
  metreLigneId?: string;
  quantite?: number;
  unite?: string;
  prixUnitaire?: number;
  prixFourniBase?: number | null;
  fraisGenerauxPercent?: number | null;
  margePercent?: number | null;
  total?: number;
  mode?: NoeudDPGFMode | null;
  prixDpuId?: string | null;
  descriptif?: string | null;
}

export interface DPGF {
  id: string;
  numero: string;
  metreId: string;
  projetNom?: string;
  devisId?: string;
  hierarchie: NoeudDPGF[];
  totalHT: number;
  tvaTaux: number;
  totalTva: number;
  totalTTC: number;
}

export type AOClientStatus =
  | 'A_ETUDIER'
  | 'EN_PREPARATION'
  | 'SOUMIS'
  | 'ATTRIBUE'
  | 'PERDU'
  | 'INFRUCTUEUX'
  | 'ANNULE';

export type AOClientType = 'PUBLIC' | 'PRIVE';

export type AOClientDocumentCategory =
  | 'DCE'
  | 'CCAP'
  | 'CCTP'
  | 'BPU'
  | 'PLAN'
  | 'REPONSE'
  | 'CAUTION'
  | 'AUTRE';

// ─── BIBLIOTHÈQUE OUVRAGES ────────────────────────────────────────────────────

export interface ComposantOuvrage {
  id: string;
  ouvrageId: string;
  type: ComposantType;
  articleId?: string;
  designation: string;
  unite: string;
  rendement: number;
  prixUnitaire: number;
  total: number;
}

export interface UniteMain {
  heures: number;
  tauxHoraire: number;
  total: number;
}

export interface Ouvrage {
  id: string;
  code: string;
  designation: string;
  category: CategoryOuvrage;
  unite: string;
  prixUnitaireHt: number;
  uniteMain: UniteMain;
  composants: ComposantOuvrage[];
  fraisGenerauxPercent: number;
  beneficePercent: number;
  isActive: boolean;
  notes?: string;
  derniereMaj: string;
  sousTotalDebourse?: number;
  /** DPU formel (composantes MATIERE / MO / …) — distinct du sous-détail historique */
  dpuComposants?: ComposantDPU[];
  dpuHistorique?: DpuHistoriqueEntry[];
  dpuId?: string;
}

export type OuvrageListItem = Pick<
  Ouvrage,
  'id' | 'code' | 'designation' | 'category' | 'unite' | 'prixUnitaireHt' | 'derniereMaj' | 'isActive'
>;

export type OuvrageCreate = Omit<Ouvrage, 'id' | 'derniereMaj' | 'sousTotalDebourse'>;
export type OuvrageUpdate = Partial<OuvrageCreate>;

// ─── MÉTRÉS ───────────────────────────────────────────────────────────────────

export interface MetreLigne {
  id: string;
  metreId: string;
  ouvrageId?: string;
  ouvrageCode?: string;
  designationLibre?: string;
  unite: string;
  /** Regroupement DPGF (défaut 01 / 01.01 si absent) */
  lotCode?: string;
  sousLotCode?: string;
  lotLibelle?: string;
  sousLotLibelle?: string;
  longueur?: number;
  largeur?: number;
  hauteur?: number;
  nombre?: number;
  formule?: string;
  quantiteCalculee: number;
  notes?: string;
}

export interface Metre {
  id: string;
  numero: string;
  projetNom: string;
  ville?: string;
  dateMetre: string;
  metreurId: string;
  metreurName?: string;
  notes?: string;
  status: MetreStatus;
  lignes: MetreLigne[];
}

export interface MetreListItem extends Omit<Metre, 'lignes'> {
  nbLignes: number;
  quantiteTotaleEstimee: number;
}

export type MetreCreate = Omit<Metre, 'id' | 'numero'>;
export type MetreUpdate = Partial<MetreCreate>;

// ─── DEVIS ────────────────────────────────────────────────────────────────────

export interface DevisLigne {
  id: string;
  devisId: string;
  ordre: number;
  parentLigneId?: string;
  type: DevisLigneType;
  code?: string;
  designation: string;
  ouvrageId?: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt?: number;
  remisePercent?: number;
  notes?: string;
}

export interface DevisVersion {
  id: string;
  devisId?: string;
  version: number;
  /** API historique. */
  snapshotDate?: string;
  date?: string;
  totalHt: number;
  modifications: string;
  url?: string;
}

export interface DevisDocument {
  name: string;
  url: string;
}

export interface Devis {
  id: string;
  numero: string;
  version: number;
  clientId: string;
  clientName?: string;
  contactClient?: string;
  /** UUID PartnerContact — référentiel. */
  contactClientId?: string | null;
  objet: string;
  ville?: string;
  dateEmission: string;
  dateValidite: string;
  metreId?: string;
  dpgfId?: string;
  dossierEtudeId?: string | null;
  bibliothequeReference?: string;
  conditionsPaiement: string;
  delaiExecutionJours?: number;
  totalHt: number;
  tvaTaux: number;
  totalTva: number;
  totalTtc: number;
  remiseGlobalePercent?: number;
  status: DevisStatus;
  motifRefus?: string;
  chantierGenereId?: string;
  notes?: string;
  /** Backend: true seulement en BROUILLON. */
  modifiable?: boolean;
  lignes: DevisLigne[];
  documents?: DevisDocument[];
  historiqueVersions: DevisVersion[];
}

export interface DevisListItem
  extends Omit<Devis, 'lignes' | 'historiqueVersions' | 'documents'> {
  nbLignes: number;
}

export type DevisCreate = Omit<
  Devis,
  'id' | 'numero' | 'version' | 'totalHt' | 'totalTva' | 'totalTtc' | 'historiqueVersions'
>;
export type DevisUpdate = Partial<DevisCreate>;

// ─── APPELS D'OFFRES CLIENTS ─────────────────────────────────────────────────

export interface AOClientDocument {
  id: string;
  aocId: string;
  category: AOClientDocumentCategory;
  name: string;
  url: string;
  obligatoire: boolean;
  fourni: boolean;
}

export interface AOClientChecklistItem {
  id: string;
  aocId: string;
  label: string;
  done: boolean;
}

export interface AppelOffreClient {
  id: string;
  numero: string;
  reference: string;
  objet: string;
  donneurOrdre: string;
  type: AOClientType;
  dateLimiteDepot: string;
  dateOuverturePlis?: string;
  cautionProvisoire?: number;
  cautionDefinitive?: number;
  cautionRetenueGarantie?: number;
  estimationMoaHt?: number;
  ville?: string;
  delaiExecutionJours?: number;
  status: AOClientStatus;
  devisId?: string;
  devisNumero?: string;
  metreId?: string;
  metreNumero?: string;
  resultatRangNotre?: number;
  resultatNbPlis?: number;
  resultatAttributaire?: string;
  resultatMontantHt?: number;
  chantierGenereId?: string;
  documents: AOClientDocument[];
  checklist: AOClientChecklistItem[];
  notes?: string;
}

export interface AppelOffreClientListItem
  extends Omit<AppelOffreClient, 'documents' | 'checklist'> {
  delaiRestant: number;
  nbDocsObligatoires: number;
  nbDocsFournis: number;
}

export type AppelOffreClientCreate = Omit<
  AppelOffreClient,
  'id' | 'numero' | 'documents' | 'checklist'
>;
export type AppelOffreClientUpdate = Partial<AppelOffreClientCreate>;

// ─── DOSSIER D'ÉTUDE (lot 2) ──────────────────────────────────────────────────

export type StatutDossierEtude =
  | 'BROUILLON'
  | 'EN_ETUDE'
  | 'EN_VALIDATION'
  | 'VALIDEE'
  | 'DEVIS_GENERE'
  | 'GAGNE'
  | 'PERDU'
  | 'CONVERTIE'
  | 'ANNULE';

/**
 * Étapes métier affichées dans le wizard (4).
 * Les numéros backend restent 1..5 ; voir `dossier-etape.util.ts` pour le mapping.
 */
export const ETAPES_DOSSIER_ETUDE = [
  { etape: 1, libelle: 'Documents du marché' },
  { etape: 2, libelle: 'Bordereau' },
  { etape: 3, libelle: 'Décomposition et consultations' },
  { etape: 4, libelle: 'Synthèse et validation' },
] as const;

/**
 * Un article qui empêche de franchir une étape.
 *
 * Le back renvoie la liste, pas un booléen : c'est ce qui permet d'afficher des liens
 * cliquables au lieu d'un bouton grisé sans explication.
 */
export interface ProblemeGate {
  /** Absent pour les problèmes globaux (ex. bordereau vide). */
  noeudId?: string | null;
  codeArticle?: string | null;
  libelle?: string | null;
  message: string;
  /** Étape backend d’origine (utile quand plusieurs gates sont fusionnées en UI). */
  etape?: number | null;
}

export interface ResultatGate {
  etape: number;
  /** Gate consultation (backend 4) non bloquante ; bordereau et chiffrage bloquent. */
  bloquant: boolean;
  problemes: ProblemeGate[];
}

export interface DossierEtude {
  id: string;
  numero: string;
  objet: string;
  clientId?: string;
  clientNom?: string;
  /** User IAM (UUID) — rôle BTP_INGENIEUR. */
  chargeEtudeUserId?: string;
  chargeEtudeNom?: string;
  cpsDocumentId?: string;
  bordereauDocumentId?: string;
  appelOffreClientId?: string;
  /** Enrichissement listing (AOC lié). */
  aoType?: string | null;
  aoDateLimiteDepot?: string | null;
  dpgfId?: string;
  currentStep: number;
  status: StatutDossierEtude;
  origine?: string;
  fraisGenerauxPercentDefaut?: number;
  margePercentDefaut?: number;
  tvaTauxDefaut?: number;
  margeGlobalePercent?: number;
  devisGenereId?: string;
  motifRefus?: string;
  bordereauRevision?: number;
  validationEtape?: 'N1' | 'N2' | string | null;
  approvalRequestId?: string | null;
  structureVerrouillee?: boolean;
  modifiable?: boolean;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  /** Verrou optimiste — à renvoyer tel quel en modification, sinon 409. */
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export type DossierEtudeCreate = Pick<DossierEtude, 'objet'> &
  Partial<
    Pick<
      DossierEtude,
      | 'numero'
      | 'clientId'
      | 'clientNom'
      | 'chargeEtudeUserId'
      | 'chargeEtudeNom'
      | 'cpsDocumentId'
      | 'bordereauDocumentId'
      | 'appelOffreClientId'
      | 'origine'
      | 'notes'
    >
  > & {
    aoReference?: string;
    aoType?: 'PUBLIC' | 'PRIVE' | string;
    dateLimiteDepot?: string;
    dateOuverturePlis?: string;
    ville?: string;
    delaiExecutionJours?: number;
    estimationMoaHt?: number;
    cautionProvisoire?: number;
    cautionDefinitive?: number;
    cautionRetenueGarantie?: number;
  };

export type DossierEtudeUpdate = Partial<DossierEtudeCreate> & { version?: number };

/** Types de pièces du marché déposables sur un dossier. */
export type TypeDossierDocument =
  | 'BORDEREAU'
  | 'CPS'
  | 'CPS_ET_BORDEREAU'
  | 'CPT'
  | 'PLAN'
  | 'REGLEMENT'
  | 'AUTRE';

export const TYPES_DOSSIER_DOCUMENT: { value: TypeDossierDocument; label: string }[] = [
  { value: 'BORDEREAU', label: 'Bordereau (BPU / DQE)' },
  { value: 'CPS', label: 'CPS / CCTP' },
  { value: 'CPS_ET_BORDEREAU', label: 'CPS + bordereau (même fichier)' },
  { value: 'CPT', label: 'CPT' },
  { value: 'PLAN', label: 'Plans' },
  { value: 'REGLEMENT', label: 'Règlement de consultation' },
  { value: 'AUTRE', label: 'Autre pièce' },
];

export interface DossierDocument {
  id: string;
  dossierEtudeId: string;
  documentId: string;
  nomFichier?: string;
  type: TypeDossierDocument | string;
  ordre: number;
  createdBy?: string;
  createdAt?: string;
}

export type SourcePieceAttendue = 'IA' | 'MANUEL';

export interface DossierPieceAttendue {
  id: string;
  dossierEtudeId: string;
  type: string;
  libelle: string;
  obligatoire: boolean;
  source: SourcePieceAttendue | string;
  dossierDocumentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarcheProposeMetadonnees {
  objet?: string | null;
  type?: string | null;
  dateLimiteDepot?: string | null;
  donneurOrdre?: string | null;
  ville?: string | null;
  reference?: string | null;
  delaiExecutionJours?: number | null;
  estimationMoaHt?: number | null;
  dateOuverturePlis?: string | null;
  cautionProvisoire?: number | null;
  cautionDefinitive?: number | null;
}

export interface MarcheProposePiece {
  type: string;
  libelle: string;
  obligatoire: boolean;
}

export interface MarchePropose {
  metadonnees?: MarcheProposeMetadonnees | null;
  piecesAttendues: MarcheProposePiece[];
  confiance?: number | null;
}
