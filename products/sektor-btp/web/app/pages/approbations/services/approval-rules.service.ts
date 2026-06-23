import { Injectable, inject } from '@angular/core';

import { ApprovalEngineService } from '@applications/erp/approbations/services/approval-engine.service';

import type { ApprovalEntityType, ApprovalEtape } from '../models';

/**
 * Seuils documentés (référence métier) — la sélection effective des étapes est portée par
 * `ApprovalEngineService` + `approval-workflows.seed.ts` (Task 12, pas de duplication de logique).
 */
export const APPROVAL_MONETARY_THRESHOLDS = {
  BC_TRIPLE_ETAPES_HT: 500_000,
  DA_DAF_HT: 50_000,
  NOTE_FRAIS_DAF_HT: 5_000,
} as const;

@Injectable({ providedIn: 'root' })
export class ApprovalRulesService {
  private readonly engine = inject(ApprovalEngineService);

  readonly thresholds = APPROVAL_MONETARY_THRESHOLDS;

  buildDefaultEtapes(
    entityType: ApprovalEntityType,
    montantHt = 0,
    options?: { referenceDate?: Date },
  ): ApprovalEtape[] {
    const wf = this.engine.selectWorkflow(entityType, { montant: montantHt });
    return this.engine.buildEtapes(wf, options);
  }

  circuitSummary(entityType: ApprovalEntityType, montantHt = 0): string {
    const wf = this.engine.selectWorkflow(entityType, { montant: montantHt });
    const etapes = this.engine.buildEtapes(wf);
    if (etapes.length === 0) {
      return 'Aucun circuit défini pour ce type.';
    }
    return `${etapes.length} étape(s) : ${etapes.map((e) => e.approbateurNom).join(' → ')}`;
  }
}
