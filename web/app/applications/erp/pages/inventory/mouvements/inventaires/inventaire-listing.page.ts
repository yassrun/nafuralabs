import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { buildInventaireListingConfig } from './config/listing/listing.config';
import { InventaireFacade, type InventaireListItem } from './services/inventaire.facade';

@Component({
  selector: 'app-inventaire-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './inventaire-listing.page.html',
  styleUrls: ['./inventaire-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class InventaireListingPage extends ConfigDrivenListingPage<InventaireListItem> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(InventaireFacade);
  readonly config = buildInventaireListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.mouvement.inventaire.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<InventaireListItem>,
  ): Promise<void> {
    console.log('Unhandled listing action:', event.actionId, event);
  }
}
