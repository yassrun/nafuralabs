/** Types métier approuvables (Task 12 M-APR-02 — 10 types cœur + annexes Round 1). */
export type ApprovalEntityType =
  | 'DA'
  | 'AO'
  | 'BC'
  | 'FF'
  | 'SIT'
  | 'CONGE'
  | 'PAIE'
  | 'VIR'
  | 'AVN'
  | 'OS'
  | 'FACTURE_CLIENT'
  | 'NOTE_FRAIS'
  | 'CONTRAT_ST';

export type ApprovalStatus = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'EXPIRE';
export type ApprovalDecision = 'APPROUVE' | 'REJETE' | 'DELEGUE' | 'ESCALADE';

export interface ApprovalEtape {
  ordre: number;
  approbateurRoleId?: string;
  approbateurNom: string;
  seuilMontantHt?: number;
  dateLimite?: string;
  decision?: ApprovalDecision;
  decisionPar?: string;
  decisionAt?: string;
  commentaire?: string;
}

export type ApprovalJournalAction =
  | 'SOUMIS'
  | 'APPROUVE'
  | 'REJETE'
  | 'DEMANDE_COMPLEMENT'
  | 'DELEGUE'
  | 'COMMENTE'
  | 'ESCALADE';

/** Journal immuable + hash chaîné SHA-256 (M-APR-03 / M-APR-08). */
export interface ApprovalJournalEntry {
  date: string;
  approbateurId: string;
  approbateurNom?: string;
  action: ApprovalJournalAction;
  commentaire?: string;
  hash?: string;
}

export interface ApprovalRequest {
  id: string;
  workflowId?: string;
  societeId?: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef: string;
  entitySummary: string;
  montantConcerne?: number;
  chantierId?: string;
  chantierCode?: string;
  initiateurId: string;
  initiateurNom: string;
  dateCreation: string;
  status: ApprovalStatus;
  etapeCourante: number;
  etapes: ApprovalEtape[];
  historique: ApprovalJournalEntry[];
  urgence: 'NORMALE' | 'HAUTE' | 'CRITIQUE';
}

export interface ApprovalSubmitInput {
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef: string;
  entitySummary: string;
  montantConcerne?: number;
  chantierId?: string;
  chantierCode?: string;
  societeId?: string;
  initiateurId?: string;
  initiateurNom?: string;
  urgence?: 'NORMALE' | 'HAUTE' | 'CRITIQUE';
}

// @i18n-exempt — @deprecated Phase 1.2 — see APPROVAL_ENTITY_TYPE_KEYS in @applications/erp/shell/i18n-labels.
export const ENTITY_TYPE_LABELS: Record<ApprovalEntityType, string> = {
  DA: "Demande d'achat",
  AO: "Appel d'offres (attribution)",
  BC: 'Bon de commande',
  FF: 'Facture fournisseur',
  SIT: 'Situation de travaux',
  CONGE: 'Demande de congé',
  PAIE: 'Fiche de paie (validation)',
  VIR: 'Virement interne',
  AVN: 'Avenant marché',
  OS: 'Ordre de service',
  FACTURE_CLIENT: 'Facture client',
  NOTE_FRAIS: 'Note de frais',
  CONTRAT_ST: 'Contrat sous-traitance',
};

export const ENTITY_TYPE_ICONS: Record<ApprovalEntityType, string> = {
  DA: 'file-question',
  AO: 'megaphone',
  BC: 'shopping-cart',
  FF: 'receipt',
  SIT: 'clipboard-list',
  CONGE: 'calendar',
  PAIE: 'wallet',
  VIR: 'arrow-left-right',
  AVN: 'file-plus',
  OS: 'file-signature',
  FACTURE_CLIENT: 'file-text',
  NOTE_FRAIS: 'banknote',
  CONTRAT_ST: 'handshake',
};
