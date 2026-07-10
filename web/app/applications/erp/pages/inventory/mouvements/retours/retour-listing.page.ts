import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { buildRetourListingConfig } from './config/listing/listing.config';
import { RetourFacade, type RetourListItem } from './services/retour.facade';

@Component({
  selector: 'app-retour-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './retour-listing.page.html',
  styleUrls: ['./retour-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class RetourListingPage extends ConfigDrivenListingPage<RetourListItem> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(RetourFacade);
  readonly config = buildRetourListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.mouvement.retour.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<RetourListItem>,
  ): Promise<void> {
    console.log('Unhandled listing action:', event.actionId, event);
  }
}
