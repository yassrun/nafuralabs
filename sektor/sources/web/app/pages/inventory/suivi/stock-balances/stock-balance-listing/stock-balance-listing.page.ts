/**
 * StockBalance Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { StockBalancesFacade } from '../services';
import type { StockBalanceListItem } from '../models';
import { STOCK_BALANCE_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-stock-balance-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-listing
        #listing
        [config]="config"
        [facade]="facade"
        (action)="onAction($event)">
      </nf-entity-listing>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenListingPageStyles],
})
export class StockBalanceListingPage extends ConfigDrivenListingPage<StockBalanceListItem> {
  readonly facade = inject(StockBalancesFacade);
  readonly config = STOCK_BALANCE_LISTING_CONFIG;
  readonly headerTitle = 'Stock Balances';

  protected override async handleCustomAction(
    event: ListingActionEvent<StockBalanceListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
