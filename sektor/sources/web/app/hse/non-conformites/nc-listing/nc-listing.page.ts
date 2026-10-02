
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { NonConformite } from '@app/hse/models';

import { NcFacade } from '../services';
import { buildNcListingConfig } from '../config';

@Component({
  selector: 'app-nc-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './nc-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class NcListingPage extends ConfigDrivenListingPage<NonConformite> {
  readonly facade = inject(NcFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildNcListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('hse.nonConformite.headerTitle');
}
