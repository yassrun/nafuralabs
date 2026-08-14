import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { ListingActionEvent } from '@platform/lib/anatomy/types';

import { buildTransfertListingConfig } from './config/listing/listing.config';
import { TransfertFacade, type TransfertListItem } from './services/transfert.facade';

@Component({
  selector: 'app-transfert-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './transfert-listing.page.html',
  styleUrls: ['./transfert-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class TransfertListingPage extends ConfigDrivenListingPage<TransfertListItem> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(TransfertFacade);
  readonly config = buildTransfertListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.mouvement.transfert.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<TransfertListItem>,
  ): Promise<void> {
    console.log('Unhandled listing action:', event.actionId, event);
  }
}
