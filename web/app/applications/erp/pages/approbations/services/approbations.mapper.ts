import type {
  ApprovalDecision,
  ApprovalEntityType,
  ApprovalJournalAction,
  ApprovalJournalEntry,
  ApprovalRequest,
  ApprovalStatus,
} from '../models';

export interface ApiApprovalEtape {
  ordre: number;
  approbateurRoleId?: string;
  approbateurNom: string;
  dateLimite?: string;
  decision?: ApprovalDecision;
  decisionPar?: string;
  decisionAt?: string;
  commentaire?: string;
}

export interface ApiApprovalEvent {
  id?: string;
  action: ApprovalJournalAction;
  userId: string;
  userNom?: string;
  commentaire?: string;
  payloadJson?: string;
  previousHash?: string;
  eventHash?: string;
  createdAt: string;
}

export interface ApiApprovalRequest {
  id: string;
  workflowId?: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef: string;
  entitySummary: string;
  montantConcerne?: number;
  chantierId?: string;
  initiateurUserId: string;
  initiateurNom: string;
  status: ApprovalStatus | 'EN_COURS' | 'ANNULE';
  etapeCouranteIndex: number;
  dateSoumission: string;
  dateCloture?: string;
  urgence: 'NORMALE' | 'HAUTE' | 'CRITIQUE';
  createdAt?: string;
  etapes?: ApiApprovalEtape[];
  historique?: ApiApprovalEvent[];
}

export interface ApiApprovalSubmit {
  id?: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef: string;
  entitySummary: string;
  montantConcerne?: number;
  chantierId?: string;
  initiateurUserId?: string;
  initiateurNom?: string;
  urgence?: 'NORMALE' | 'HAUTE' | 'CRITIQUE';
}

export interface ApiApprovalAction {
  userId?: string;
  userNom?: string;
  commentaire?: string;
  payloadJson?: string;
}

function mapStatus(status: ApiApprovalRequest['status']): ApprovalStatus {
  if (status === 'EN_COURS' || status === 'EN_ATTENTE') return 'EN_ATTENTE';
  if (status === 'APPROUVE' || status === 'REJETE' || status === 'EXPIRE') return status;
  return 'EN_ATTENTE';
}

export function approvalRequestToUi(row: ApiApprovalRequest): ApprovalRequest {
  const historique: ApprovalJournalEntry[] = (row.historique ?? []).map((h) => ({
    date: h.createdAt,
    approbateurId: h.userId,
    approbateurNom: h.userNom,
    action: h.action,
    commentaire: h.commentaire,
    hash: h.eventHash,
  }));

  return {
    id: row.id,
    workflowId: row.workflowId,
    entityType: row.entityType,
    entityId: row.entityId,
    entityRef: row.entityRef,
    entitySummary: row.entitySummary,
    montantConcerne: row.montantConcerne,
    chantierId: row.chantierId,
    initiateurId: row.initiateurUserId,
    initiateurNom: row.initiateurNom,
    dateCreation: row.dateSoumission,
    status: mapStatus(row.status),
    etapeCourante: row.etapeCouranteIndex,
    urgence: row.urgence,
    etapes: (row.etapes ?? []).map((e) => ({
      ordre: e.ordre,
      approbateurRoleId: e.approbateurRoleId,
      approbateurNom: e.approbateurNom,
      seuilMontantHt: undefined,
      dateLimite: e.dateLimite,
      decision: e.decision,
      decisionPar: e.decisionPar,
      decisionAt: e.decisionAt,
      commentaire: e.commentaire,
    })),
    historique,
  };
}

export function approvalSubmitToApi(input: {
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef: string;
  entitySummary: string;
  montantConcerne?: number;
  chantierId?: string;
  initiateurId?: string;
  initiateurNom?: string;
  urgence?: 'NORMALE' | 'HAUTE' | 'CRITIQUE';
}): ApiApprovalSubmit {
  return {
    entityType: input.entityType,
    entityId: input.entityId,
    entityRef: input.entityRef,
    entitySummary: input.entitySummary,
    montantConcerne: input.montantConcerne,
    chantierId: input.chantierId,
    initiateurUserId: input.initiateurId,
    initiateurNom: input.initiateurNom,
    urgence: input.urgence,
  };
}

export function approvalActionToApi(
  commentaire?: string,
  userId?: string,
  userNom?: string,
): ApiApprovalAction {
  return { commentaire, userId, userNom };
}
