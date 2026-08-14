/**
 * PaymentTerm Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { ListingActionEvent } from '@platform/lib/anatomy/types';

import { PaymentTermsFacade } from '../services';
import type { PaymentTermListItem } from '../models';
import { PAYMENT_TERM_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-payment-term-listing',
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class PaymentTermListingPage extends ConfigDrivenListingPage<PaymentTermListItem> {
  readonly facade = inject(PaymentTermsFacade);
  readonly config = PAYMENT_TERM_LISTING_CONFIG;
  readonly headerTitle = 'Payment Terms';

  protected override async handleCustomAction(
    event: ListingActionEvent<PaymentTermListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
