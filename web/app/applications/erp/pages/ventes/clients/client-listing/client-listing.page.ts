import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import { SmartImportTriggerComponent } from '@platform/features/documents/smart-import';
import { ClientImportHandlerRegistrar } from '@applications/erp/shared/smart-import/handlers/client-import.handler';
import type { ClientVenteListItem } from '../models';

import { ClientVenteFacade } from '../services';
import { CLIENT_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-client-listing',
  standalone: true,
  imports: [CommonModule, SmartImportTriggerComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './client-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class ClientListingPage extends ConfigDrivenListingPage<ClientVenteListItem> {
  readonly facade = inject(ClientVenteFacade);
  private readonly _importHandler = inject(ClientImportHandlerRegistrar);
  readonly config = CLIENT_LISTING_CONFIG;
  readonly headerTitle = 'Clients';

  onSmartImportComplete(): void {
    this.listingComponent?.refresh();
  }
}
