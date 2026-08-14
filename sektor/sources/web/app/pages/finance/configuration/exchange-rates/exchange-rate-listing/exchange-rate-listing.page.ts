/**
 * ExchangeRate Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { ExchangeRatesFacade } from '../services';
import type { ExchangeRateListItem } from '../models';
import { EXCHANGE_RATE_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-exchange-rate-listing',
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
export class ExchangeRateListingPage extends ConfigDrivenListingPage<ExchangeRateListItem> {
  readonly facade = inject(ExchangeRatesFacade);
  readonly config = EXCHANGE_RATE_LISTING_CONFIG;
  readonly headerTitle = 'Exchange Rates';

  protected override async handleCustomAction(
    event: ListingActionEvent<ExchangeRateListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
