import type { StatusActionBarConfig } from '@platform/lib/anatomy';
import { and } from '@platform/lib/anatomy';

import type { StatutDossierEtude } from '@app/etudes/models';
import { DOSSIER_STATUT_LABELS, DOSSIER_STATUT_VARIANTS } from '../utils/dossier-status.util';

export interface DossierStatusContext {
  status: string;
  availableActions: string[];
  actionPrincipale: string;
  peutDeciderGo: boolean;
  peutAccepterAffectation: boolean;
  peutSaisirApresGo: boolean;
  peutRenvoyerAffectation: boolean;
  chargeDejaDesigne: boolean;
  peutAvisExecution: boolean;
  chiffragePret: boolean;
  structureVerrouillee: boolean;
  modifiable: boolean;
  phase: string;
  avisExecutionDossier?: string | null;
  exigeAvis: boolean;
  peutValiderFinancier: boolean;
  peutValiderDefinitif: boolean;
}

function allows(backendAction: string) {
  return (ctx: DossierStatusContext) =>
    !ctx.availableActions.length || ctx.availableActions.includes(backendAction);
}

function statusDef(code: StatutDossierEtude) {
  return {
    label: DOSSIER_STATUT_LABELS[code],
    variant: DOSSIER_STATUT_VARIANTS[code] ?? 'default',
  };
}

export const DOSSIER_STATUS_BAR: StatusActionBarConfig<StatutDossierEtude, DossierStatusContext> = {
  statuses: {
    DRAFT: statusDef('DRAFT'),
    PENDING_ASSIGNMENT: statusDef('PENDING_ASSIGNMENT'),
    REJECTED: statusDef('REJECTED'),
    ASSIGNED: statusDef('ASSIGNED'),
    STUDY_REJECTED: statusDef('STUDY_REJECTED'),
    IN_PROGRESS: statusDef('IN_PROGRESS'),
    SUSPENDED: statusDef('SUSPENDED'),
    COMPLETED: statusDef('COMPLETED'),
    FINANCIALLY_APPROVED: statusDef('FINANCIALLY_APPROVED'),
    FINANCIALLY_REJECTED: statusDef('FINANCIALLY_REJECTED'),
    FINAL_APPROVED: statusDef('FINAL_APPROVED'),
    FINAL_REJECTED: statusDef('FINAL_REJECTED'),
    ARCHIVED: statusDef('ARCHIVED'),
  },
  transitions: [
    {
      from: 'DRAFT',
      to: 'PENDING_ASSIGNMENT',
      action: 'SOUMETTRE_GO',
      backendAction: 'SUBMIT_FOR_ASSIGNMENT',
      actionLabel: 'Soumettre pour affectation',
      variant: 'primary',
      hasAccess: and(allows('SUBMIT_FOR_ASSIGNMENT'), (ctx) => !(ctx.peutRenvoyerAffectation && ctx.chargeDejaDesigne)),
    },
    {
      from: 'DRAFT',
      to: 'ASSIGNED',
      action: 'RENVOYER_AFFECTATION',
      backendAction: 'ASSIGN_STUDY',
      actionLabel: 'Affecter',
      variant: 'primary',
      hasAccess: and(allows('ASSIGN_STUDY'), (ctx) => ctx.peutRenvoyerAffectation && ctx.chargeDejaDesigne),
    },
    {
      from: 'PENDING_ASSIGNMENT',
      to: 'ASSIGNED',
      action: 'DECIDER_GO',
      backendAction: 'ASSIGN_STUDY',
      actionLabel: 'Affecter',
      variant: 'primary',
      hasAccess: and(allows('ASSIGN_STUDY'), (ctx) => ctx.peutDeciderGo),
    },
    {
      from: 'PENDING_ASSIGNMENT',
      to: 'REJECTED',
      action: 'NO_GO',
      backendAction: 'REJECT_STUDY',
      actionLabel: 'Rejeter',
      variant: 'ghost',
      hasAccess: and(allows('REJECT_STUDY'), (ctx) => ctx.peutDeciderGo),
    },
    {
      from: 'ASSIGNED',
      to: 'IN_PROGRESS',
      action: 'ACCEPTER_AFFECTATION',
      backendAction: 'START_STUDY',
      actionLabel: 'Démarrer l\'étude',
      variant: 'primary',
      hasAccess: and(allows('START_STUDY'), (ctx) => ctx.peutAccepterAffectation),
    },
    {
      from: 'ASSIGNED',
      to: 'STUDY_REJECTED',
      action: 'REFUSER_AFFECTATION',
      backendAction: 'REJECT_BY_STUDY_TEAM',
      actionLabel: 'Rejeter',
      variant: 'ghost',
      hasAccess: and(allows('REJECT_BY_STUDY_TEAM'), (ctx) => ctx.peutAccepterAffectation),
    },
    {
      from: 'REJECTED',
      to: 'DRAFT',
      action: 'REVENIR_DRAFT',
      backendAction: 'RETURN_TO_DRAFT',
      actionLabel: 'Renvoyer en brouillon',
      variant: 'primary',
      hasAccess: and(
        allows('RETURN_TO_DRAFT'),
        (ctx) => ctx.peutRenvoyerAffectation || ctx.peutDeciderGo,
      ),
    },
    {
      from: ['STUDY_REJECTED', 'FINANCIALLY_REJECTED', 'FINAL_REJECTED'],
      to: 'IN_PROGRESS',
      action: 'REPRENDRE_CHIFFRAGE',
      backendAction: 'RESUME_STUDY',
      actionLabel: 'Reprendre',
      variant: 'primary',
      hasAccess: and(
        allows('RESUME_STUDY'),
        (ctx) => ctx.peutRenvoyerAffectation || ctx.peutSaisirApresGo,
      ),
    },
    {
      from: 'IN_PROGRESS',
      to: 'COMPLETED',
      action: 'SOUMETTRE_CHIFFRAGE',
      backendAction: 'COMPLETE_STUDY',
      actionLabel: 'Chiffrage terminé',
      variant: 'primary',
      hasAccess: and(allows('COMPLETE_STUDY'), (ctx) => ctx.peutSaisirApresGo && ctx.chiffragePret),
    },
    {
      from: 'IN_PROGRESS',
      to: 'SUSPENDED',
      action: 'SUSPENDRE_CHIFFRAGE',
      backendAction: 'SUSPEND_STUDY',
      actionLabel: 'Suspendre',
      variant: 'ghost',
      hasAccess: and(allows('SUSPEND_STUDY'), (ctx) => ctx.peutSaisirApresGo),
    },
    {
      from: 'SUSPENDED',
      to: 'IN_PROGRESS',
      action: 'REPRENDRE_CHIFFRAGE',
      backendAction: 'RESUME_STUDY',
      actionLabel: 'Reprendre',
      variant: 'primary',
      hasAccess: and(allows('RESUME_STUDY'), (ctx) => ctx.peutSaisirApresGo),
    },
    {
      from: 'COMPLETED',
      to: 'FINANCIALLY_APPROVED',
      action: 'VALIDER_FINANCIER',
      backendAction: 'APPROVE_FINANCIALLY',
      actionLabel: 'Valider financièrement',
      variant: 'primary',
      hasAccess: and(allows('APPROVE_FINANCIALLY'), (ctx) => ctx.peutValiderFinancier),
    },
    {
      from: 'COMPLETED',
      to: 'FINANCIALLY_REJECTED',
      action: 'REFUSER',
      backendAction: 'REJECT_FINANCIALLY',
      actionLabel: 'Refuser',
      variant: 'ghost',
      hasAccess: and(allows('REJECT_FINANCIALLY'), (ctx) => ctx.peutValiderFinancier),
    },
    {
      from: 'FINANCIALLY_APPROVED',
      to: 'FINAL_APPROVED',
      action: 'VALIDER_DEFINITIF',
      backendAction: 'APPROVE_FINAL',
      actionLabel: 'Valider définitivement',
      variant: 'primary',
      hasAccess: and(allows('APPROVE_FINAL'), (ctx) => ctx.peutValiderDefinitif),
    },
    {
      from: 'FINANCIALLY_APPROVED',
      to: 'FINAL_REJECTED',
      action: 'REFUSER',
      backendAction: 'REJECT_FINAL',
      actionLabel: 'Refuser',
      variant: 'ghost',
      hasAccess: and(allows('REJECT_FINAL'), (ctx) => ctx.peutValiderDefinitif),
    },
    {
      from: [
        'DRAFT',
        'PENDING_ASSIGNMENT',
        'REJECTED',
        'ASSIGNED',
        'STUDY_REJECTED',
        'IN_PROGRESS',
        'SUSPENDED',
        'COMPLETED',
        'FINANCIALLY_APPROVED',
        'FINANCIALLY_REJECTED',
        'FINAL_REJECTED',
      ],
      to: 'ARCHIVED',
      action: 'ARCHIVER',
      backendAction: 'ARCHIVE_STUDY',
      actionLabel: 'Archiver',
      variant: 'ghost',
      hasAccess: (ctx) => {
        if (ctx.availableActions.includes('ARCHIVE_STUDY')) return true;
        if (ctx.status === 'DRAFT' || ctx.status === 'REJECTED') return true;
        return ctx.peutDeciderGo;
      },
    },
  ],
  commands: [
    {
      action: 'REOUVRIR_BORDEREAU',
      actionLabel: 'Réouvrir le bordereau',
      variant: 'ghost',
      isVisible: (ctx) =>
        ctx.status !== 'IN_PROGRESS' &&
        ctx.status !== 'SUSPENDED' &&
        ctx.modifiable &&
        ctx.structureVerrouillee &&
        ctx.phase === 'CHIFFRAGE',
    },
    {
      action: 'AVIS_EXECUTION_RETOUR',
      actionLabel: 'Retour au chiffrage',
      variant: 'ghost',
      isVisible: (ctx) =>
        ctx.status === 'IN_PROGRESS' &&
        ctx.peutAvisExecution &&
        ctx.exigeAvis &&
        ctx.avisExecutionDossier !== 'FAVORABLE',
    },
  ],
};

/** Hors FSM : devis / chantier / issue commerciale après Validé définitivement. */
export const DOSSIER_SUITE_ACTIONS: Array<{
  action: string;
  actionLabel: string;
  variant: 'primary' | 'ghost';
  testId?: string;
  isVisible: (ctx: DossierStatusContext) => boolean;
}> = [
  {
    action: 'MARQUER_PERDU',
    actionLabel: 'Marquer perdu',
    variant: 'ghost',
    isVisible: (ctx) => ctx.status === 'FINAL_APPROVED',
  },
  {
    action: 'GENERER_DEVIS',
    actionLabel: 'Générer le devis',
    variant: 'primary',
    testId: 'dossier-cta-generer-devis',
    isVisible: (ctx) => ctx.actionPrincipale === 'GENERER_DEVIS',
  },
  {
    action: 'VOIR_DEVIS',
    actionLabel: 'Voir le devis',
    variant: 'primary',
    isVisible: (ctx) => ctx.actionPrincipale === 'VOIR_DEVIS',
  },
  {
    action: 'CONVERTIR',
    actionLabel: 'Créer le chantier',
    variant: 'primary',
    isVisible: (ctx) => ctx.actionPrincipale === 'CONVERTIR',
  },
  {
    action: 'VOIR_CHANTIER',
    actionLabel: 'Ouvrir le chantier',
    variant: 'primary',
    isVisible: (ctx) => ctx.actionPrincipale === 'VOIR_CHANTIER',
  },
  {
    action: 'MARQUER_GAGNE',
    actionLabel: 'Marquer gagné',
    variant: 'primary',
    isVisible: (ctx) => ctx.actionPrincipale === 'MARQUER_GAGNE',
  },
];
