
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { FichePaie } from '@app/rh/models';

import { PaieFacade } from '../services';
import { buildPaieListingConfig } from '../config';

@Component({
  selector: 'app-paie-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './paie-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class PaieListingPage extends ConfigDrivenListingPage<FichePaie> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(PaieFacade);
  readonly config = buildPaieListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('rh.paie.listing.headerTitle');
}
