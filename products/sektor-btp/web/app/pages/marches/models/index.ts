// ── Types ──────────────────────────────────────────────────────────────────

export type MarcheType = 'FORFAIT' | 'BPU' | 'REGIE' | 'MIXTE';
export type MarcheNature = 'PUBLIC' | 'PRIVE_GRAND_COMPTE' | 'PRIVE_PME' | 'PARTICULIER';
export type MarcheStatus =
  | 'BROUILLON'
  | 'SIGNE'
  | 'EN_EXECUTION'
  | 'RECEPTION_PROVISOIRE'
  | 'RECEPTION_DEFINITIVE'
  | 'CLOTURE'
  | 'RESILIE';

export type AvenantType =
  | 'TVX_SUPPLEMENTAIRES'
  | 'PROLONGATION_DELAI'
  | 'MIXTE'
  | 'ADAPTATION_TECHNIQUE'
  | 'AUTRE';
export type AvenantStatus = 'BROUILLON' | 'PROPOSE' | 'SIGNE' | 'REJETE';

export type FactureMarcheStatus =
  | 'BROUILLON'
  | 'EMISE'
  | 'ENVOYEE_MOA'
  | 'ACCEPTEE'
  | 'PAYEE_PARTIEL'
  | 'PAYEE'
  | 'CONTESTEE';

export type DgdStatus =
  | 'BROUILLON'
  | 'SOUMIS_MOA'
  | 'NOTIFIE'
  | 'PAYE'
  | 'CONTESTE';

export type OrdreServiceType =
  | 'COMMENCEMENT'
  | 'ARRET'
  | 'REPRISE'
  | 'MODIFICATION'
  | 'NOTIFICATION';

export type OrdreServiceStatus = 'EMIS' | 'RECEPTIONNE' | 'CONTESTE' | 'CLOS';

export type PenaliteType = 'RETARD' | 'QUALITE' | 'AUTRE';
export type PenaliteStatus = 'BROUILLON' | 'VALIDEE' | 'ANNULEE';

export type RythmeAmortissementAvance = 'LINEAIRE_SUR_DUREE' | 'PRORATA_SITUATIONS';


export type CautionType = 'PROVISOIRE' | 'DEFINITIVE' | 'RESTITUTION_AVANCE' | 'RETENUE_GARANTIE';
export type CautionStatus = 'EMISE' | 'ACTIVE' | 'LEVEE' | 'EXPIRE' | 'JOUE';

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface FormuleRevisionK {
  termeFixe: number;
  termesVariables: Array<{
    coefficient: number;
    indiceCode: string;
    indiceBaseValeur: number;
  }>;
}

export interface Marche {
  id: string;
  numero: string;              // MAR-2026-001
  reference?: string;          // ref MOA
  intitule: string;
  chantierId: string;
  chantierCode: string;
  chantierNom: string;
  clientId: string;
  clientNom: string;
  clientIce?: string;
  clientIf?: string;
  clientRc?: string;
  type: MarcheType;
  nature: MarcheNature;
  montantInitialHt: number;
  tvaTaux: number;             // 20 | 14 | 10
  retenueGarantieTaux: number; // 7% standard
  retenueSourceTaux: number;   // 5% si PUBLIC, sinon 0
  avanceForfaitairePercent?: number;
  delaiExecutionMois: number;
  penaliteRetardJourPercent?: number;
  dateOrdreService?: string;
  dateReceptionProvisoire?: string;
  dateReceptionDefinitive?: string;
  formuleRevisionK?: FormuleRevisionK;
  status: MarcheStatus;
  // Computed / denormalized
  montantAvenantsHt: number;
  montantTotalHt: number;
  avancementPercent: number;
  cumulFactureHt: number;
  cumulEncaisseHt: number;
  /** Task 07 — avances de démarrage (marchés publics) */
  avancesDemarrage?: AvanceDemarrage[];
}

export interface DGD {
  id: string;
  numero: string;
  marcheId: string;
  marcheNumero: string;
  cumulSituationsTtc: number;
  cumulRetenueGarantie: number;
  cumulRevisionK: number;
  cumulPenalites: number;
  reprisesRG: number;
  montantNetAPayer: number;
  status: DgdStatus;
  dateSoumission?: string;
  dateNotification?: string;
  documentUrl?: string;
}

export interface PenaliteMarche {
  id: string;
  numero: string;
  marcheId: string;
  marcheNumero: string;
  type: PenaliteType;
  motif: string;
  montantHt: number;
  joursRetard: number;
  dateConstat: string;
  status: PenaliteStatus;
}

export interface OrdreService {
  id: string;
  numero: string;
  marcheId: string;
  chantierId: string;
  chantierCode: string;
  type: OrdreServiceType;
  dateEmission: string;
  emetteur: 'MOA' | 'MOE' | 'NAFURA';
  objet: string;
  description: string;
  impactDelai?: number;
  impactCout?: number;
  dateAccuseReception?: string;
  documentUrl?: string;
  status: OrdreServiceStatus;
}

export interface AvanceDemarrage {
  id: string;
  marcheId: string;
  tauxPct: number;
  montantHt: number;
  montantTtc: number;
  cautionRestitutionId?: string;
  dateVersement?: string;
  rythmeAmortissement: RythmeAmortissementAvance;
  cumulAmorti: number;
  resteAAmortir: number;
}

export interface Avenant {
  id: string;
  numero: string;              // AV-MAR-2026-001-01
  marcheId: string;
  marcheNumero: string;
  type: AvenantType;
  objet: string;
  motif: string;
  montantHt: number;           // peut être négatif
  prolongationJours: number;
  dateSignature?: string;
  status: AvenantStatus;
  /** ISO date — impact budget/planning/cautions déjà propagé (Task 07 M-MAR-01) */
  impactPropageLe?: string;
}

export interface PaiementFactureMarche {
  id: string;
  factureId: string;
  date: string;
  montant: number;
  reference?: string;
  modePaiement: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'AUTRE';
}

export interface FactureMarche {
  id: string;
  numero: string;               // FM-2026-00001
  marcheId: string;
  marcheNumero: string;
  chantierId: string;
  chantierCode: string;
  clientNom: string;
  situationsIds: string[];
  dateEmission: string;
  dateEcheance: string;
  // Montants
  montantBrutHt: number;
  avanceDeduiteHt: number;
  retenueGarantieHt: number;   // 7% × brut
  netHt: number;               // brut - avance - RG
  tvaTaux: number;
  tvaMontant: number;
  netTtc: number;
  retenueSourceTaux: number;   // 5% si PUBLIC
  retenueSourceMontant: number;
  timbreFiscal: number;
  netAPayer: number;
  status: FactureMarcheStatus;
  paiements: PaiementFactureMarche[];
}

export interface CautionBancaire {
  id: string;
  numero: string;              // CB-2026-001
  marcheId: string;
  marcheNumero: string;
  type: CautionType;
  banqueEmettrice: string;
  numeroBancaire?: string;
  montant: number;
  dateEmission: string;
  dateValiditeJusquA: string;
  dateLevee?: string;
  status: CautionStatus;
}

// ── Label maps ─────────────────────────────────────────────────────────────
//
// Phase 1.2 (i18n roadmap, agent B2): every label map below is **deprecated**
// — use the corresponding `*_KEYS` map from `@applications/erp/shell/i18n-labels`
// consumed via `{{ KEYS[value] | translate }}` in templates or
// `translateService.instant(KEYS[value])` in TS. The FR strings are kept until
// Wave C migrates each usage. Lint exemption via `@i18n-exempt` markers.

// @i18n-exempt — @deprecated Phase 1.2 — see MARCHE_TYPE_KEYS.
export const MARCHE_TYPE_LABELS: Record<MarcheType, string> = {
  FORFAIT: 'Prix global forfaitaire',
  BPU: 'Bordereau Prix Unitaires',
  REGIE: 'Régie',
  MIXTE: 'Mixte',
};

// @i18n-exempt — @deprecated Phase 1.2 — see MARCHE_NATURE_KEYS.
export const MARCHE_NATURE_LABELS: Record<MarcheNature, string> = {
  PUBLIC: 'Public (État / CT)',
  PRIVE_GRAND_COMPTE: 'Privé grand compte',
  PRIVE_PME: 'Privé PME',
  PARTICULIER: 'Particulier',
};

// @i18n-exempt — @deprecated Phase 1.2 — see MARCHE_STATUS_KEYS.
export const MARCHE_STATUS_LABELS: Record<MarcheStatus, string> = {
  BROUILLON: 'Brouillon',
  SIGNE: 'Signé',
  EN_EXECUTION: 'En exécution',
  RECEPTION_PROVISOIRE: 'Récep. provisoire',
  RECEPTION_DEFINITIVE: 'Récep. définitive',
  CLOTURE: 'Clôturé',
  RESILIE: 'Résilié',
};

export const MARCHE_STATUS_VARIANT: Record<MarcheStatus, string> = {
  BROUILLON: 'secondary',
  SIGNE: 'info',
  EN_EXECUTION: 'success',
  RECEPTION_PROVISOIRE: 'info',
  RECEPTION_DEFINITIVE: 'success',
  CLOTURE: 'secondary',
  RESILIE: 'danger',
};

// @i18n-exempt — @deprecated Phase 1.2 — see AVENANT_TYPE_KEYS.
export const AVENANT_TYPE_LABELS: Record<AvenantType, string> = {
  TVX_SUPPLEMENTAIRES: 'Travaux supplémentaires',
  PROLONGATION_DELAI: 'Prolongation de délai',
  MIXTE: 'Mixte',
  ADAPTATION_TECHNIQUE: 'Adaptation technique',
  AUTRE: 'Autre',
};

// @i18n-exempt — @deprecated Phase 1.2 — see AVENANT_STATUS_KEYS.
export const AVENANT_STATUS_LABELS: Record<AvenantStatus, string> = {
  BROUILLON: 'Brouillon',
  PROPOSE: 'Proposé',
  SIGNE: 'Signé',
  REJETE: 'Rejeté',
};

// @i18n-exempt — @deprecated Phase 1.2 — see FACTURE_MARCHE_STATUS_KEYS.
export const FACTURE_STATUS_LABELS: Record<FactureMarcheStatus, string> = {
  BROUILLON: 'Brouillon',
  EMISE: 'Émise',
  ENVOYEE_MOA: 'Envoyée MOA',
  ACCEPTEE: 'Acceptée',
  PAYEE_PARTIEL: 'Part. payée',
  PAYEE: 'Payée',
  CONTESTEE: 'Contestée',
};

export const FACTURE_STATUS_VARIANT: Record<FactureMarcheStatus, string> = {
  BROUILLON: 'secondary',
  EMISE: 'info',
  ENVOYEE_MOA: 'info',
  ACCEPTEE: 'success',
  PAYEE_PARTIEL: 'warning',
  PAYEE: 'success',
  CONTESTEE: 'danger',
};

// @i18n-exempt — @deprecated Phase 1.2 — see CAUTION_TYPE_KEYS.
export const CAUTION_TYPE_LABELS: Record<CautionType, string> = {
  PROVISOIRE: 'Caution provisoire',
  DEFINITIVE: 'Caution définitive',
  RESTITUTION_AVANCE: 'Restitution avance',
  RETENUE_GARANTIE: 'Retenue de garantie',
};

// @i18n-exempt — @deprecated Phase 1.2 — see CAUTION_STATUS_KEYS.
export const CAUTION_STATUS_LABELS: Record<CautionStatus, string> = {
  EMISE: 'Émise',
  ACTIVE: 'Active',
  LEVEE: 'Levée',
  EXPIRE: 'Expirée',
  JOUE: 'Jouée',
};

// @i18n-exempt — @deprecated Phase 1.2 — see DGD_STATUS_KEYS.
export const DGD_STATUS_LABELS: Record<DgdStatus, string> = {
  BROUILLON: 'Brouillon',
  SOUMIS_MOA: 'Soumis MOA',
  NOTIFIE: 'Notifié',
  PAYE: 'Payé',
  CONTESTE: 'Contesté',
};

// @i18n-exempt — @deprecated Phase 1.2 — see ORDRE_SERVICE_TYPE_KEYS.
export const ORDRE_SERVICE_TYPE_LABELS: Record<OrdreServiceType, string> = {
  COMMENCEMENT: 'Commencement',
  ARRET: 'Arrêt',
  REPRISE: 'Reprise',
  MODIFICATION: 'Modification',
  NOTIFICATION: 'Notification',
};

// @i18n-exempt — @deprecated Phase 1.2 — see ORDRE_SERVICE_STATUS_KEYS.
export const ORDRE_SERVICE_STATUS_LABELS: Record<OrdreServiceStatus, string> = {
  EMIS: 'Émis',
  RECEPTIONNE: 'Réceptionné',
  CONTESTE: 'Contesté',
  CLOS: 'Clos',
};
