import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { FactureClient } from '@applications/erp/ventes/models';

import { FactureFacade } from '../services';
import { buildFactureListingConfig } from '../config';

@Component({
  selector: 'app-facture-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './facture-listing.page.html',
  styleUrls: ['./facture-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class FactureListingPage extends ConfigDrivenListingPage<FactureClient> {
  readonly facade = inject(FactureFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildFactureListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('ventes.facture.headerTitle');
}
