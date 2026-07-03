import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ClientVenteListItem } from '../models';

import { ClientVenteFacade } from '../services';
import { CLIENT_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-client-listing',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenListingPageImports],
  templateUrl: './client-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class ClientListingPage extends ConfigDrivenListingPage<ClientVenteListItem> {
  readonly facade = inject(ClientVenteFacade);
  readonly config = CLIENT_LISTING_CONFIG;
  readonly headerTitle = 'Clients';
}
