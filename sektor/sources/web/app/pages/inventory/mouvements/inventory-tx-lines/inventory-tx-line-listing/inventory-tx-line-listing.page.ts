/**
 * InventoryTxLine Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { InventoryTxLinesFacade } from '../services';
import type { InventoryTxLineListItem } from '../models';
import { INVENTORY_TX_LINE_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-inventory-tx-line-listing',
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
export class InventoryTxLineListingPage extends ConfigDrivenListingPage<InventoryTxLineListItem> {
  readonly facade = inject(InventoryTxLinesFacade);
  readonly config = INVENTORY_TX_LINE_LISTING_CONFIG;
  readonly headerTitle = 'Inventory Tx Lines';

  protected override async handleCustomAction(
    event: ListingActionEvent<InventoryTxLineListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
