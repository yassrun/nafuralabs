import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { LocationConfigFacade } from '../services';
import type { LocationConfigListItem } from '../models';
import { buildDepotListingConfig } from '../config';

@Component({
  selector: 'app-location-config-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './location-listing.page.html',
  styleUrls: ['./location-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class LocationListingPage extends ConfigDrivenListingPage<LocationConfigListItem> {
  readonly facade = inject(LocationConfigFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildDepotListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.configuration.depot.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<LocationConfigListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
