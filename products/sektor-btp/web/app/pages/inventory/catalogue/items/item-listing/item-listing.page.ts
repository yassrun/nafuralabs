/**
 * Item Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { ItemsFacade } from '../services';
import type { ItemListItem } from '../models';
import { ITEM_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-item-listing',
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
export class ItemListingPage extends ConfigDrivenListingPage<ItemListItem> {
  readonly facade = inject(ItemsFacade);
  readonly config = ITEM_LISTING_CONFIG;
  readonly headerTitle = 'Items';

  protected override async handleCustomAction(
    event: ListingActionEvent<ItemListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
