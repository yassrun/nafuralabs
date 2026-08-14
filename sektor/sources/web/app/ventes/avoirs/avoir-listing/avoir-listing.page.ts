import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';

import type { Avoir } from '@app/ventes/models';

import { AvoirFacade } from '../services';
import { buildAvoirListingConfig } from '../config';

@Component({
  selector: 'app-avoir-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './avoir-listing.page.html',
  styleUrls: ['./avoir-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class AvoirListingPage extends ConfigDrivenListingPage<Avoir> {
  readonly facade = inject(AvoirFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildAvoirListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('ventes.avoir.headerTitle');
}
