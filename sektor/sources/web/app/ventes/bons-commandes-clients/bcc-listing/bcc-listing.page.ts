
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles} from '@platform/lib/anatomy';
import type { BonCommandeClient } from '@app/ventes/models';

import { BccFacade } from '../services';
import { BCC_LISTING_CONFIG } from '../config';

@Component({
  selector: 'app-bcc-listing',
  standalone: true,
  imports: [
    ...ConfigDrivenListingPageImports
],
  templateUrl: './bcc-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class BccListingPage extends ConfigDrivenListingPage<BonCommandeClient> {
  readonly facade = inject(BccFacade);
  readonly config = BCC_LISTING_CONFIG;
  readonly headerTitle = 'Bons de commande clients';
}
