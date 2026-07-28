// ─── Finance · Trésorerie & Comptabilité — Domain Models ──────────────────────
// Specs:
//   docs/specs/erp-frontend-agents/08-finance/01-finance-comptabilite.md
//   docs/specs/erp-frontend-agents/08-finance/02-finance-tresorerie.md
//   docs/specs/erp-frontend-agents/08-finance/03-finance-configuration.md

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION : DEVISES, TAUX DE CHANGE, CONDITIONS DE PAIEMENT
// ═══════════════════════════════════════════════════════════════════════════

export interface Devise {
  id: string;
  code: string;
  symbole: string;
  libelle: string;
  isDeviseDeReference: boolean;
  precisionDecimales: number;
  isActive: boolean;
}

export type DeviseListItem = Devise;
export type DeviseCreate = Omit<Devise, 'id'>;
export type DeviseUpdate = Partial<DeviseCreate>;

export type TauxChangeSource = 'BAM' | 'MANUEL' | 'API';

export interface TauxChange {
  id: string;
  deviseDeId: string;
  deviseDeCode?: string;
  deviseVersId: string;
  deviseVersCode?: string;
  dateValidite: string;
  taux: number;
  source?: TauxChangeSource;
  isActive: boolean;
}

export type TauxChangeListItem = TauxChange;
export type TauxChangeCreate = Omit<TauxChange, 'id'>;
export type TauxChangeUpdate = Partial<TauxChangeCreate>;

export type ConditionPaiementType =
  | 'IMMEDIAT'
  | 'DELAI_SIMPLE'
  | 'FIN_DE_MOIS'
  | 'ECHEANCES_MULTIPLES';

export interface EcheancePaiement {
  id: string;
  conditionId: string;
  ordre: number;
  pourcentage: number;
  delaiJours: number;
  description: string;
}

export interface ConditionPaiement {
  id: string;
  code: string;
  libelle: string;
  type: ConditionPaiementType;
  delaiJours?: number;
  echeances?: EcheancePaiement[];
  isActive: boolean;
  isDefaut: boolean;
  notes?: string;
}

export interface ConditionPaiementListItem
  extends Omit<ConditionPaiement, 'echeances'> {
  nbEcheances: number;
}

export type ConditionPaiementCreate = Omit<ConditionPaiement, 'id'>;
export type ConditionPaiementUpdate = Partial<ConditionPaiementCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// PLAN COMPTABLE · COMPTES + JOURNAUX
// ═══════════════════════════════════════════════════════════════════════════

export type CompteClasse = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type CompteType =
  | 'CHARGE'
  | 'PRODUIT'
  | 'ACTIF'
  | 'PASSIF'
  | 'TIERS'
  | 'TRESORERIE';

export interface Compte {
  id: string;
  code: string;
  libelle: string;
  classe: CompteClasse;
  type: CompteType;
  parentCompteCode?: string;
  isCollectif: boolean;
  isLettrable: boolean;
  isAuxiliaire: boolean;
  axeAnalytiqueObligatoire?: boolean;
  isActive: boolean;
  nbEcritures?: number;
}

export interface CompteListItem extends Compte {
  hasChildren?: boolean;
}

export type CompteCreate = Omit<Compte, 'id' | 'nbEcritures'>;
export type CompteUpdate = Partial<CompteCreate>;

export interface CompteTreeNode {
  compte: Compte;
  children: CompteTreeNode[];
}

export type JournalType =
  | 'VENTE'
  | 'ACHAT'
  | 'BANQUE'
  | 'CAISSE'
  | 'OPERATIONS_DIVERSES'
  | 'NOUVEAUX';

export interface Journal {
  id: string;
  code: string;
  libelle: string;
  type: JournalType;
  contrePartieDefautCode?: string;
  isActive: boolean;
}

export type JournalListItem = Journal;
export type JournalCreate = Omit<Journal, 'id'>;
export type JournalUpdate = Partial<JournalCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// AXES ANALYTIQUES (chantiers, départements…)
// ═══════════════════════════════════════════════════════════════════════════

export type AxeAnalytiqueType = 'CHANTIER' | 'DEPARTEMENT' | 'ACTIVITE';

export interface AxeAnalytique {
  id: string;
  type: AxeAnalytiqueType;
  code: string;
  libelle: string;
  parentId?: string;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ÉCRITURES COMPTABLES
// ═══════════════════════════════════════════════════════════════════════════

export type EcritureStatus = 'BROUILLON' | 'VALIDEE' | 'CLOTUREE';

export type EcritureOrigine =
  | 'MANUELLE'
  | 'AUTO_FACTURE_CLIENT'
  | 'AUTO_FACTURE_FOURN'
  | 'AUTO_REGLEMENT'
  | 'AUTO_PAIE'
  | 'AUTO_AVOIR'
  | 'AUTO_SITUATION';

export interface LigneEcriture {
  id: string;
  ecritureId: string;
  ordre: number;
  compteCode: string;
  compteLibelle?: string;
  debit: number;
  credit: number;
  libelle: string;
  axeAnalytique?: string;
  axeAnalytiqueLibelle?: string;
  tiersId?: string;
  tiersName?: string;
  echeance?: string;
}

export interface Ecriture {
  id: string;
  numero: string;
  journalCode: string;
  journalLibelle?: string;
  dateEcriture: string;
  exercice: number;
  periode: number;
  reference?: string;
  libelle: string;
  status: EcritureStatus;
  origine?: EcritureOrigine;
  origineId?: string;
  origineLabel?: string;
  totalDebit: number;
  totalCredit: number;
  validateurId?: string;
  validateurName?: string;
  validationDate?: string;
  lignes: LigneEcriture[];
  notes?: string;
}

export interface EcritureListItem
  extends Omit<Ecriture, 'lignes'> {
  nbLignes: number;
}

export type EcritureCreate = Omit<
  Ecriture,
  | 'id'
  | 'numero'
  | 'totalDebit'
  | 'totalCredit'
  | 'validateurId'
  | 'validateurName'
  | 'validationDate'
>;
export type EcritureUpdate = Partial<EcritureCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// FACTURES FOURNISSEURS
// ═══════════════════════════════════════════════════════════════════════════

export type FactureFournStatus =
  | 'BROUILLON'
  | 'VALIDEE'
  | 'COMPTABILISEE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'EN_LITIGE'
  | 'AVOIRISEE'
  | 'ANNULEE';

export interface FactureFournDocument {
  name: string;
  url: string;
}

export interface FactureFournLigne {
  id: string;
  factureId: string;
  ordre: number;
  designation: string;
  bcLigneId?: string;
  compteCode: string;
  axeAnalytique?: string;
  axeAnalytiqueLibelle?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
  tvaTaux: number;
}

export interface FactureFournisseur {
  id: string;
  numeroInterne: string;
  numeroFournisseur: string;
  fournisseurId: string;
  fournisseurName?: string;
  bcId?: string;
  bcNumero?: string;
  receptionId?: string;
  receptionNumero?: string;
  chantierId?: string;
  chantierName?: string;
  rubrique?: string;

  dateFacture: string;
  dateReception: string;
  dateEcheance: string;

  totalHt: number;
  totalTva: number;
  totalTtc: number;
  /** Montant TVA à déclarer en autoliquidation (facture fournisseur non-résident), si applicable. */
  tvaAutoliquidationMontant?: number;
  /** Mode de facturation TVA côté fournisseur (démo). */
  tvaFacturationMode?: 'NORMAL' | 'AUTOLIQUIDATION';
  /** Retenue RAS spécifique auto-entrepreneur (démo % du HT), en complément TVA autoliquidée. */
  retenueRasAutoEntrepreneurMad?: number;
  retenueTvaPercent?: number;
  retenueTvaMontant?: number;
  netAPayerTtc: number;

  cumulRegleTtc: number;
  resteARegler: number;

  status: FactureFournStatus;
  ecritureId?: string;
  documents?: FactureFournDocument[];
  notes?: string;
  motifLitige?: string;
  lignes: FactureFournLigne[];
}

export interface FactureFournListItem
  extends Omit<FactureFournisseur, 'lignes' | 'documents'> {
  nbLignes: number;
  delaiRetard: number;
}

export type FactureFournCreate = Omit<
  FactureFournisseur,
  | 'id'
  | 'numeroInterne'
  | 'totalHt'
  | 'totalTva'
  | 'totalTtc'
  | 'netAPayerTtc'
  | 'cumulRegleTtc'
  | 'resteARegler'
  | 'ecritureId'
>;
export type FactureFournUpdate = Partial<FactureFournCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// BALANCE & ANALYTIQUE — vues calculées
// ═══════════════════════════════════════════════════════════════════════════

export interface BalanceLigne {
  compteCode: string;
  compteLibelle: string;
  classe: CompteClasse;
  type: CompteType;
  reportsDebit: number;
  reportsCredit: number;
  mouvementsDebit: number;
  mouvementsCredit: number;
  soldeDebit: number;
  soldeCredit: number;
}

export interface BalanceTotaux {
  reportsDebit: number;
  reportsCredit: number;
  mouvementsDebit: number;
  mouvementsCredit: number;
  soldeDebit: number;
  soldeCredit: number;
}

export type BalanceVue = 'GENERALE' | 'AUX_CLIENTS' | 'AUX_FOURNISSEURS';

export interface BalanceQuery {
  dateDebut?: string;
  dateFin?: string;
  classe?: CompteClasse;
  type?: CompteType;
  axeAnalytique?: string;
  vue?: BalanceVue;
}

export interface AnalytiqueCellule {
  compteCode: string;
  compteLibelle: string;
  classe: CompteClasse;
  axeId: string;          // 'NON_AFFECTE' pour les non affectés
  axeLibelle: string;
  montant: number;
  nbLignes: number;
}

export interface AnalytiqueQuery {
  dateDebut?: string;
  dateFin?: string;
  axeType?: AxeAnalytiqueType;
  classes?: CompteClasse[];
  search?: string;
}

export interface AnalytiquePivot {
  axes: { id: string; libelle: string }[];
  comptes: {
    code: string;
    libelle: string;
    classe: CompteClasse;
    parAxe: Record<string, number>;
    total: number;
  }[];
  margeParAxe: Record<string, number>;
}

export interface JournalSummary {
  journalCode: string;
  journalLibelle: string;
  type: JournalType;
  totalDebit: number;
  totalCredit: number;
  solde: number;
  nbEcritures: number;
}



// ═══════════════════════════════════════════════════════════════════════════
// COMPTES FINANCIERS (Banques + Caisses)
// ═══════════════════════════════════════════════════════════════════════════

export type CompteFinancierType = 'BANQUE' | 'CAISSE';

export interface CompteFinancier {
  id: string;
  code: string;
  libelle: string;
  type: CompteFinancierType;
  banque?: string;
  rib?: string;
  agence?: string;
  devise: string;
  compteCgncCode: string;
  soldeInitial: number;
  soldeActuel: number;
  responsableId?: string;
  responsableName?: string;
  isActive: boolean;
  notes?: string;
}

export interface CompteFinancierStats {
  id: string;
  nbMouvementsMois: number;
  totalRecettesMois: number;
  totalDepensesMois: number;
  variation24h: number;
  derniereMaj: string;
}

export type CompteFinancierListItem = CompteFinancier & CompteFinancierStats;

export type CompteFinancierCreate = Omit<
  CompteFinancier,
  'id' | 'soldeActuel'
>;
export type CompteFinancierUpdate = Partial<CompteFinancierCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// MOUVEMENTS DE TRÉSORERIE
// ═══════════════════════════════════════════════════════════════════════════

export type MouvementTresorerieType =
  | 'REGLEMENT_CLIENT'
  | 'REGLEMENT_FOURN'
  | 'PAIEMENT_PAIE'
  | 'VIREMENT_INTERNE'
  | 'FRAIS_BANCAIRES'
  | 'COMMISSIONS'
  | 'AUTRE_RECETTE'
  | 'AUTRE_DEPENSE';

export type ModePaiement =
  | 'VIREMENT'
  | 'CHEQUE'
  | 'EFFET'
  | 'ESPECES'
  | 'CARTE'
  | 'COMPENSATION';

export type ContrePartieType =
  | 'CLIENT'
  | 'FOURNISSEUR'
  | 'EMPLOYE'
  | 'COMPTE_INTERNE'
  | 'AUTRE';

export interface MouvementTresorerie {
  id: string;
  numero: string;
  compteFinancierId: string;
  compteFinancierLibelle?: string;
  date: string;
  type: MouvementTresorerieType;
  modePaiement: ModePaiement;
  reference?: string;
  contrePartieType?: ContrePartieType;
  contrePartieId?: string;
  contrePartieName?: string;
  factureClientId?: string;
  factureFournId?: string;
  reglementId?: string;
  virementInterneId?: string;
  recette: number;
  depense: number;
  libelle: string;
  ecritureId?: string;
  rapprocheId?: string;
  notes?: string;
  createdAt: string;
}

export type MouvementTresorerieListItem = MouvementTresorerie & {
  soldeApres?: number;
  rapproche: boolean;
};

export type MouvementTresorerieCreate = Omit<
  MouvementTresorerie,
  'id' | 'numero' | 'createdAt'
>;
export type MouvementTresorerieUpdate = Partial<MouvementTresorerieCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// VIREMENTS INTERNES
// ═══════════════════════════════════════════════════════════════════════════

export type VirementInterneStatus = 'BROUILLON' | 'VALIDE' | 'ANNULE';

export interface VirementInterne {
  id: string;
  numero: string;
  date: string;
  compteSourceId: string;
  compteSourceLibelle?: string;
  compteDestId: string;
  compteDestLibelle?: string;
  montant: number;
  motif: string;
  reference?: string;
  status: VirementInterneStatus;
  ecritureId?: string;
  notes?: string;
}

export type VirementInterneListItem = VirementInterne;

export type VirementInterneCreate = Omit<
  VirementInterne,
  'id' | 'numero' | 'ecritureId'
>;
export type VirementInterneUpdate = Partial<VirementInterneCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// RÈGLEMENTS (CLIENTS / FOURNISSEURS / EMPLOYÉS)
// ═══════════════════════════════════════════════════════════════════════════

export type ReglementType = 'CLIENT' | 'FOURNISSEUR' | 'EMPLOYE';
export type ReglementStatus = 'BROUILLON' | 'VALIDE' | 'ANNULE';

export interface ReglementImputation {
  id: string;
  reglementId: string;
  factureId: string;
  factureNumero?: string;
  factureDate?: string;
  factureEcheance?: string;
  factureRestant?: number;
  montantImpute: number;
}

export interface Reglement {
  id: string;
  numero: string;
  type: ReglementType;
  date: string;
  modePaiement: ModePaiement;
  reference?: string;
  banqueEmise?: string;

  contrePartieId: string;
  contrePartieName?: string;

  compteFinancierId: string;
  compteFinancierLibelle?: string;

  montantTotal: number;
  imputations: ReglementImputation[];

  status: ReglementStatus;
  ecritureId?: string;
  mouvementId?: string;
  notes?: string;
  createdAt: string;
}

export interface ReglementListItem
  extends Omit<Reglement, 'imputations' | 'ecritureId'> {
  nbFacturesImputees: number;
}

export type ReglementCreate = Omit<
  Reglement,
  'id' | 'numero' | 'createdAt' | 'mouvementId' | 'ecritureId'
>;
export type ReglementUpdate = Partial<ReglementCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// RAPPROCHEMENT BANCAIRE
// ═══════════════════════════════════════════════════════════════════════════

export type RapprochementStatus = 'EN_COURS' | 'VALIDE' | 'ANOMALIE';

export interface RapprochementLigneReleve {
  id: string;
  rapprochementId: string;
  date: string;
  libelle: string;
  reference?: string;
  recette: number;
  depense: number;
  matchedMouvementId?: string;
}

export interface Rapprochement {
  id: string;
  numero: string;
  compteFinancierId: string;
  compteFinancierLibelle?: string;
  dateDebut: string;
  dateFin: string;
  soldeDebutComptable: number;
  soldeFinComptable: number;
  soldeFinReleve: number;
  ecart: number;
  status: RapprochementStatus;
  validateurId?: string;
  validateurName?: string;
  dateValidation?: string;
  releveDocumentUrl?: string;
  releveDocumentName?: string;
  lignesReleve: RapprochementLigneReleve[];
  mouvementsRapprochesIds: string[];
  notes?: string;
}

export type RapprochementListItem = Omit<
  Rapprochement,
  'lignesReleve' | 'mouvementsRapprochesIds'
> & {
  nbMouvementsRapproches: number;
  nbLignesReleve: number;
};

export type RapprochementCreate = Omit<
  Rapprochement,
  'id' | 'numero' | 'lignesReleve' | 'mouvementsRapprochesIds'
> & {
  lignesReleve?: RapprochementLigneReleve[];
  mouvementsRapprochesIds?: string[];
};

export type RapprochementUpdate = Partial<RapprochementCreate>;

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUPS / RÉFÉRENTIELS (utilisés pour règlements + mouvements)
// ═══════════════════════════════════════════════════════════════════════════

export type FactureClientStatus =
  | 'BROUILLON'
  | 'EMISE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'ANNULEE';

export interface FactureOuverte {
  id: string;
  type: 'CLIENT' | 'FOURNISSEUR';
  numero: string;
  contrePartieId: string;
  contrePartieName: string;
  date: string;
  echeance: string;
  totalTtc: number;
  cumulRegleTtc: number;
  resteARegler: number;
  status: FactureClientStatus | string;
  reference?: string;
}

export interface ContrePartie {
  id: string;
  type: ContrePartieType;
  name: string;
  ice?: string;
  ville?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LETTRAGE (M-FIN-01)
// ═══════════════════════════════════════════════════════════════════════════

export type LettrageStatus = 'EQUILIBRE' | 'PARTIEL' | 'OUVERT';

/** Clé stable d'une ligne d'écriture : `${ecritureId}::${ligneId}`. */
export type LettrageLigneKey = `${string}::${string}`;

export interface Lettrage {
  id: string;
  codeLettrage: string;
  comptePcg: string;
  ligneKeys: LettrageLigneKey[];
  status: LettrageStatus;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  createdAt: string;
}

export interface LettrageCandidateLigne {
  ligneKey: LettrageLigneKey;
  ecritureId: string;
  ligneId: string;
  date: string;
  piece: string;
  libelle: string;
  debit: number;
  credit: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// RECOUVREMENT (M-FIN-02)
// ═══════════════════════════════════════════════════════════════════════════

export type NiveauRelance = 0 | 1 | 2 | 3 | 4;

export type CanalRelance = 'EMAIL' | 'SMS' | 'COURRIER' | 'WHATSAPP';

export interface SuiviRecouvrement {
  factureId: string;
  clientId: string;
  clientName?: string;
  numeroFacture: string;
  montantTtc: number;
  dateEcheance: string;
  joursRetard: number;
  niveauRelance: NiveauRelance;
  derniereRelanceDate?: string;
  prochaineRelanceDate?: string;
  totalRelances: number;
  notes?: string;
}

export interface ModeleRelance {
  id: string;
  niveau: 1 | 2 | 3 | 4;
  canal: CanalRelance;
  delaiJ: number;
  sujet: string;
  corps: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EFFETS DE COMMERCE (M-FIN-03)
// ═══════════════════════════════════════════════════════════════════════════

export type EffetCommerceType = 'LCR' | 'LCN';

export type EffetCommerceStatus =
  | 'PORTEFEUILLE'
  | 'REMIS_ENCAISSEMENT'
  | 'ESCOMPTE'
  | 'PAYE'
  | 'IMPAYE'
  | 'PROTESTE';

export interface EffetCommerce {
  id: string;
  numero: string;
  type: EffetCommerceType;
  factureId: string;
  clientId: string;
  clientName?: string;
  banqueDomicile: string;
  banqueTireeId?: string;
  montant: number;
  dateEcheance: string;
  dateRemise?: string;
  dateEscompte?: string;
  status: EffetCommerceStatus;
  fraisEscompte?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// VIREMENTS FOURNISSEURS — REMISE XML (M-FIN-04)
// ═══════════════════════════════════════════════════════════════════════════

export type BanqueVirementXmlFormat =
  | 'SEPA'
  | 'AWB'
  | 'BMCE'
  | 'CIH'
  | 'BP'
  | 'BMCI'
  | 'SGM'
  | 'CAM'
  | 'CFG';

export interface VirementFournisseurRemiseLine {
  id: string;
  beneficiaire: string;
  rib: string;
  montant: number;
  motif: string;
  referencePiece?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAISSES CHANTIER (M-FIN-09)
// ═══════════════════════════════════════════════════════════════════════════

export type CaisseChantierStatus = 'OUVERTE' | 'FERMEE';

export interface CaisseChantier {
  id: string;
  chantierId: string;
  chantierLabel?: string;
  chefChantierId: string;
  chefChantierName?: string;
  soldeInitial: number;
  soldeActuel: number;
  status: CaisseChantierStatus;
  dateOuverture: string;
  dateCloture?: string;
}

export type MouvementCaisseChantierType =
  | 'AVANCE_RECUE'
  | 'DEPENSE'
  | 'JUSTIFICATIF'
  | 'RETOUR';

export type MouvementCaisseChantierWorkflowStatus =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'VALIDE'
  | 'REJETE';

export interface MouvementCaisseChantier {
  id: string;
  caisseId: string;
  date: string;
  type: MouvementCaisseChantierType;
  montant: number;
  categorie?: string;
  description: string;
  photoTicketUrl?: string;
  geoloc?: { lat: number; lng: number };
  validePar?: string;
  status: MouvementCaisseChantierWorkflowStatus;
}

export type { ComptaFournisseur } from './compta-fournisseur.model';
