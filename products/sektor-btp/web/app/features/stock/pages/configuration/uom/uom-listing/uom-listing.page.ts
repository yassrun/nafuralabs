import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { UomFacade } from '../services';
import type { UomListItem } from '../models';
import { buildUomListingConfig } from '../config';

@Component({
  selector: 'app-uom-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './uom-listing.page.html',
  styleUrls: ['./uom-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class UomListingPage extends ConfigDrivenListingPage<UomListItem> {
  readonly facade = inject(UomFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildUomListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.configuration.uom.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<UomListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
