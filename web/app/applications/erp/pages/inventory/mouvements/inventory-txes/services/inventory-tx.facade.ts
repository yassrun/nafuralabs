/**
 * InventoryTx Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { InventoryTxesApiService } from './inventory-tx-api.service';
import { StockBudgetSyncService } from '@applications/erp/shell/stock-budget-sync.service';
import type { InventoryTx, InventoryTxCreate, InventoryTxUpdate } from '../models';

/**
 * Validation input for a stock outflow committed to a chantier. The facade
 * forwards the lines to the BudgetFacade so the chantier "réalisé HT" stays in
 * sync with stock consumption (Task 5.7).
 */
export interface OutflowValidationInput {
  txId: string;
  txNumber: string;
  chantierId: string;
  lines: Array<{
    articleId?: string;
    articleCode?: string;
    articleLabel?: string;
    unite?: string;
    qte: number;
    prixUnitaireHt: number;
    /** Poste budgétaire (rubrique) — fourni par le facade appelant depuis l’article HTTP. */
    rubrique?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class InventoryTxesFacade extends GridFacade<InventoryTx, InventoryTxCreate, InventoryTxUpdate> {
  protected override api = inject(InventoryTxesApiService);
  private readonly stockBudgetSync = inject(StockBudgetSyncService);
  /**
   * Confirm a stock outflow toward a chantier. Each line is forwarded to the
   * budget facade which increments the chantier "réalisé HT" by line.
   *
   * Returns the number of lines successfully synced to a chantier budget.
   */
  validateChantierOutflow(input: OutflowValidationInput): number {
    if (!input.chantierId || input.lines.length === 0) return 0;
    let synced = 0;
    for (const line of input.lines) {
      const prixUnitaireHt = line.prixUnitaireHt ?? 0;
      const ok = this.stockBudgetSync.recordOutflow({
        chantierId: input.chantierId,
        articleId: line.articleId,
        articleCode: line.articleCode,
        articleLabel: line.articleLabel,
        unite: line.unite,
        qte: line.qte,
        prixUnitaireHt,
        rubrique: line.rubrique,
        reference: input.txNumber,
      });
      if (ok) synced++;
    }
    return synced;
  }
}
