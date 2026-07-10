import type { ApprovalEntityType } from '@applications/erp/pages/approbations/models';

/**
 * Matrice workflow (Task 12 M-APR-01) — définitions seedées, sélection par type + conditions.
 */
export interface ApprovalWorkflow {
  id: string;
  nom: string;
  entityType: ApprovalEntityType;
  conditions: ApprovalCondition[];
  etapes: EtapeWorkflow[];
  delaiSLAJours: number;
  escaladeApresJ?: number;
  societeId?: string;
  actif: boolean;
}

export interface ApprovalCondition {
  champ: string;
  operateur: '<' | '<=' | '=' | '>=' | '>' | 'IN';
  valeur: number | string | string[];
}

export interface EtapeWorkflow {
  ordre: number;
  type: 'SERIE' | 'PARALLELE';
  approbateurs: ApprovateurConfig[];
  quorumPct?: number;
  optionnelle?: boolean;
}

export interface ApprovateurConfig {
  type: 'ROLE' | 'PERSONNE' | 'MANAGER' | 'DELEGATION';
  ref: string;
}

export interface WorkflowSelectionContext {
  montant?: number;
  societeId?: string;
}
