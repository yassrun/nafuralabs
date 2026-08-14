/**
 * Currency Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { CurrenciesFacade } from '../services';
import type { CurrencyListItem } from '../models';
import { CURRENCY_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-currency-listing',
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
export class CurrencyListingPage extends ConfigDrivenListingPage<CurrencyListItem> {
  readonly facade = inject(CurrenciesFacade);
  readonly config = CURRENCY_LISTING_CONFIG;
  readonly headerTitle = 'Currencies';

  protected override async handleCustomAction(
    event: ListingActionEvent<CurrencyListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
