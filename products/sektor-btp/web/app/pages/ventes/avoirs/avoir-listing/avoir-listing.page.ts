import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { Avoir } from '@applications/erp/ventes/models';

import { AvoirFacade } from '../services';
import { buildAvoirListingConfig } from '../config';

@Component({
  selector: 'app-avoir-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './avoir-listing.page.html',
  styleUrls: ['./avoir-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class AvoirListingPage extends ConfigDrivenListingPage<Avoir> {
  readonly facade = inject(AvoirFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildAvoirListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('ventes.avoir.headerTitle');
}
