/**
 * ItemType Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { ItemTypesFacade } from '../services';
import type { ItemTypeListItem } from '../models';
import { ITEM_TYPE_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-item-type-listing',
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
export class ItemTypeListingPage extends ConfigDrivenListingPage<ItemTypeListItem> {
  readonly facade = inject(ItemTypesFacade);
  readonly config = ITEM_TYPE_LISTING_CONFIG;
  readonly headerTitle = 'Item Types';

  protected override async handleCustomAction(
    event: ListingActionEvent<ItemTypeListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
