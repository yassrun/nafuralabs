import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { Metre } from '@applications/erp/etudes/models';

import { MetreFacade } from '../services';
import { buildMetreListingConfig } from '../config';

@Component({
  selector: 'app-metre-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './metre-listing.page.html',
  styleUrls: ['./metre-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class MetreListingPage extends ConfigDrivenListingPage<Metre> {
  readonly facade = inject(MetreFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildMetreListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.metre.title');
}
