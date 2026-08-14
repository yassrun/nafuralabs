/**
 * StockBalance Detail Page — Generated once (wrapper file).
 * Add custom detail behavior here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { StockBalancesFacade } from '../services';
import type { StockBalance, StockBalanceCreate } from '../models';
import { STOCK_BALANCE_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-stock-balance-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-detail
        #detail
        [config]="config"
        [mode]="mode()"
        [item]="item()"
        [lookups]="lookups()"
        [loading]="isLoading()"
        [saving]="isSaving()"
        (action)="onAction($event)">
      </nf-entity-detail>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenDetailPageStyles],
})
export class StockBalanceDetailPage extends ConfigDrivenDetailPage<StockBalance> {
  private readonly crud = inject(StockBalancesFacade);
  readonly facade = createDetailFacadeFromCrud<StockBalance, StockBalanceCreate>({
    crud: this.crud,
  });
  readonly config = STOCK_BALANCE_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Stock Balance';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Stock Balance Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<StockBalance>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
