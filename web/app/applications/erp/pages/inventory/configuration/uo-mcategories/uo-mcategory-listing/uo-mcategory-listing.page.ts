/**
 * UoMCategory Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { UoMCategoriesFacade } from '../services';
import type { UoMCategoryListItem } from '../models';
import { UO_MCATEGORY_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-uo-mcategory-listing',
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
export class UoMCategoryListingPage extends ConfigDrivenListingPage<UoMCategoryListItem> {
  readonly facade = inject(UoMCategoriesFacade);
  readonly config = UO_MCATEGORY_LISTING_CONFIG;
  readonly headerTitle = 'Uo M Categories';

  protected override async handleCustomAction(
    event: ListingActionEvent<UoMCategoryListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
