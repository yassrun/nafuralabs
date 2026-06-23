/**
 * Stock → Budget sync service.
 *
 * Bridges validated stock outflows to the chantier budget realised line.
 * Implements the contract defined in
 * `docs/specs/erp-audit-roadmap/05-stock-module.md` task 5.7.
 *
 * V1: mapping article→rubrique par heuristique sur le code. **V2** : lorsque
 * l’article porte `posteBudgetId` (code rubrique ex. MATERIAUX), le facade
 * transmet `rubrique` explicite et l’heuristique est contournée.
 */

import { Injectable, inject } from '@angular/core';
import { BudgetFacade } from '@applications/erp/pages/chantiers/budget/services';

/**
 * Heuristic mapping article code prefix → budget rubrique (fallback V1).
 */
const ARTICLE_RUBRIQUE_MAP: Array<[RegExp, string]> = [
  [/^(CIM|BET|SAB|GRA|AGR|FER|ROND|TOR|BRI|PAR|BLO|PLA)/i, 'MATERIAUX'],
  [/^(LOC|MAT|ENG|GRU|ECH)/i, 'LOCATION_MATERIEL'],
  [/^(CAR|GAS|ESS|FUE)/i, 'CARBURANT'],
  [/^(ST|SOU|TST)/i, 'SOUS_TRAITANCE'],
  [/^(EPI|OUT)/i, 'FRAIS_GENERAUX'],
];

function inferRubrique(articleCodeOrLabel?: string): string {
  if (!articleCodeOrLabel) return 'MATERIAUX';
  const text = articleCodeOrLabel.trim();
  for (const [pattern, rubrique] of ARTICLE_RUBRIQUE_MAP) {
    if (pattern.test(text)) return rubrique;
  }
  return 'MATERIAUX';
}

export interface StockOutflowInput {
  /** Chantier id or code that consumed the stock. */
  chantierId: string;
  /** Article id (used to drill down into the budget rubrique). */
  articleId?: string;
  /** Article code or label (used to infer the budget rubrique). */
  articleCode?: string;
  /** Article label for the drilldown row. */
  articleLabel?: string;
  /** Unit of measure (sacs, T, kg…). */
  unite?: string;
  /** Quantity consumed. */
  qte: number;
  /** Unit cost (PMP, FIFO, etc.). */
  prixUnitaireHt: number;
  /** Optional explicit rubrique — overrides the inferred mapping. */
  rubrique?: string;
  /** Reference of the stock outflow movement (TX number, BL, etc.). */
  reference?: string;
}

@Injectable({ providedIn: 'root' })
export class StockBudgetSyncService {
  private readonly budget = inject(BudgetFacade);

  /**
   * Forward a validated stock outflow to the chantier budget facade. Returns
   * true when a chantier was matched and updated.
   */
  recordOutflow(input: StockOutflowInput): boolean {
    if (!input.chantierId || input.qte <= 0 || input.prixUnitaireHt < 0) return false;
    const montantHt = Math.round(input.qte * input.prixUnitaireHt * 100) / 100;
    const rubrique =
      input.rubrique?.trim() ||
      inferRubrique(input.articleCode ?? input.articleLabel);
    return this.budget.recordConsommation({
      chantierId: input.chantierId,
      rubrique,
      montantHt,
      articleId: input.articleId,
      articleLabel: input.articleLabel,
      unite: input.unite,
      qte: input.qte,
      reference: input.reference,
      origin: 'STOCK',
    });
  }
}
