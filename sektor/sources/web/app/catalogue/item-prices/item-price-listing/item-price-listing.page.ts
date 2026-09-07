/**
 * ItemPrice Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { ListingActionEvent } from '@platform/lib/anatomy/types';

import { ItemPricesFacade } from '../services';
import type { ItemPriceListItem } from '../models';
import { ITEM_PRICE_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-item-price-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  template: `
    <nf-screen [header]="headerConfig">
      <nf-entity-listing
        #listing
        [config]="config"
        [facade]="facade"
        (action)="onAction($event)">
      </nf-entity-listing>
    </nf-screen>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class ItemPriceListingPage extends ConfigDrivenListingPage<ItemPriceListItem> {
  readonly facade = inject(ItemPricesFacade);
  readonly config = ITEM_PRICE_LISTING_CONFIG;
  readonly headerTitle = 'Item Prices';

  protected override async handleCustomAction(
    event: ListingActionEvent<ItemPriceListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
