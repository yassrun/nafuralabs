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

export interface ComposantDPU {
  id: string;
  type: DpuComposantType;
  articleOuPosteId: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total: number;
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
  articleId: string;
  unite: string;
  composants: ComposantDPU[];
  deboursSec: number;
  fraisGenerauxPercent: number;
  margeBeneficiairePercent: number;
  prixVenteHT: number;
  prixVenteTTC: number;
  tvaTaux: number;
}

export type NoeudDPGFType = 'LOT' | 'SOUS_LOT' | 'ARTICLE';

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
  total?: number;
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
  devisId: string;
  version: number;
  date: string;
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
  objet: string;
  ville?: string;
  dateEmission: string;
  dateValidite: string;
  metreId?: string;
  dpgfId?: string;
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
