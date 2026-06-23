import { Injectable } from '@angular/core';

import type { ApprovalEntityType } from '@applications/erp/pages/approbations/models';
import type { ApprovalEtape } from '@applications/erp/pages/approbations/models';

import type { ApprovalWorkflow, WorkflowSelectionContext } from '../models/approval-workflow.models';
import {
  APPROVAL_WORKFLOW_SEEDS,
  resolveApprobateurDisplay,
} from './approval-workflows.seed';

function ctxValue(ctx: WorkflowSelectionContext, champ: string): unknown {
  if (champ === 'montant') {
    return ctx.montant ?? 0;
  }
  if (champ === 'societeId') {
    return ctx.societeId ?? '';
  }
  return (ctx as Record<string, unknown>)[champ];
}

function matchesCondition(
  cond: ApprovalWorkflow['conditions'][number],
  ctx: WorkflowSelectionContext,
): boolean {
  const raw = ctxValue(ctx, cond.champ);
  switch (cond.operateur) {
    case '<':
      return Number(raw) < Number(cond.valeur);
    case '<=':
      return Number(raw) <= Number(cond.valeur);
    case '=':
      return raw === cond.valeur || String(raw) === String(cond.valeur);
    case '>=':
      return Number(raw) >= Number(cond.valeur);
    case '>':
      return Number(raw) > Number(cond.valeur);
    case 'IN':
      return Array.isArray(cond.valeur) && cond.valeur.map(String).includes(String(raw));
    default:
      return false;
  }
}

function workflowMatches(w: ApprovalWorkflow, ctx: WorkflowSelectionContext): boolean {
  if (!w.actif) {
    return false;
  }
  if (w.societeId && ctx.societeId && w.societeId !== ctx.societeId) {
    return false;
  }
  return w.conditions.every((c) => matchesCondition(c, ctx));
}

@Injectable({ providedIn: 'root' })
export class ApprovalEngineService {
  readonly workflows: readonly ApprovalWorkflow[] = APPROVAL_WORKFLOW_SEEDS;

  selectWorkflow(entityType: ApprovalEntityType, ctx: WorkflowSelectionContext): ApprovalWorkflow {
    const candidates = this.workflows.filter((w) => w.entityType === entityType && workflowMatches(w, ctx));
    if (candidates.length === 0) {
      throw new Error(`Aucun workflow actif pour le type ${entityType}`);
    }
    candidates.sort((a, b) => b.conditions.length - a.conditions.length);
    return candidates[0]!;
  }

  buildEtapes(workflow: ApprovalWorkflow, options?: { referenceDate?: Date }): ApprovalEtape[] {
    const ref = options?.referenceDate ?? new Date();
    const horizon = (days: number) => {
      const d = new Date(ref);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    return workflow.etapes.map((step, idx) => {
      const slaDays = workflow.delaiSLAJours + idx * 2;
      const labels = step.approbateurs.map((a) => resolveApprobateurDisplay(a));
      const primary = labels[0]!;
      const nom =
        step.type === 'PARALLELE'
          ? labels.map((l) => l.nom).join(' / ')
          : labels.map((l) => l.nom).join(' + ');
      return {
        ordre: idx,
        approbateurRoleId: primary.roleId,
        approbateurNom: nom,
        dateLimite: horizon(slaDays),
      } satisfies ApprovalEtape;
    });
  }

  /** Jours depuis l’échéance SLA de l’étape courante (positif = en retard). */
  slaLagDays(req: { etapes: ApprovalEtape[]; etapeCourante: number; status: string }): number {
    if (req.status !== 'EN_ATTENTE') {
      return 0;
    }
    const step = req.etapes[req.etapeCourante];
    if (!step?.dateLimite) {
      return 0;
    }
    const lim = new Date(step.dateLimite).getTime();
    return Math.max(0, Math.ceil((Date.now() - lim) / 86400000));
  }

  /** Prochaine date d’escalade fictive (démo) : création + escaladeApresJ. */
  nextEscaladeAt(workflow: ApprovalWorkflow, dateCreationIso: string): Date | null {
    const j = workflow.escaladeApresJ;
    if (j == null) {
      return null;
    }
    const d = new Date(dateCreationIso);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    d.setDate(d.getDate() + j);
    return d;
  }
}
