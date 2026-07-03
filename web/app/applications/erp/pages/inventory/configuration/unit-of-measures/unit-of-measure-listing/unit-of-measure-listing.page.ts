/**
 * UnitOfMeasure Listing Page — Generated once (wrapper file).
 * Add custom listing actions here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { UnitOfMeasuresFacade } from '../services';
import type { UnitOfMeasureListItem } from '../models';
import { UNIT_OF_MEASURE_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-unit-of-measure-listing',
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
export class UnitOfMeasureListingPage extends ConfigDrivenListingPage<UnitOfMeasureListItem> {
  readonly facade = inject(UnitOfMeasuresFacade);
  readonly config = UNIT_OF_MEASURE_LISTING_CONFIG;
  readonly headerTitle = 'Unit Of Measures';

  protected override async handleCustomAction(
    event: ListingActionEvent<UnitOfMeasureListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
