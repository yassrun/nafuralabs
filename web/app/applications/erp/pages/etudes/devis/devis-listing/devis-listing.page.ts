import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { Devis } from '@applications/erp/etudes/models';

import { DevisFacade } from '../services';
import { buildDevisListingConfig } from '../config';

@Component({
  selector: 'app-devis-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './devis-listing.page.html',
  styleUrls: ['./devis-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class DevisListingPage extends ConfigDrivenListingPage<Devis> {
  readonly facade = inject(DevisFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildDevisListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.devis.title');
}
