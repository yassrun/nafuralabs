import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import {
  SmartImportTriggerComponent,
  type ReviewedExtraction,
} from '@platform/features/documents/smart-import';
import {
  CLIENT_IMPORT_DEFINITION,
  ClientImportService,
} from '@app/shared/smart-import/handlers/client-import.handler';
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
  private readonly importer = inject(ClientImportService);
  readonly importDefinition = CLIENT_IMPORT_DEFINITION;
  readonly config = CLIENT_LISTING_CONFIG;
  readonly headerTitle = 'Clients';

  async onSmartImportComplete(result: ReviewedExtraction): Promise<void> {
    await this.importer.import(result.data);
    this.listingComponent?.refresh();
  }
}
