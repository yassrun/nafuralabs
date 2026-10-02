
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { Conge } from '@app/rh/models';

import { CongeFacade } from '../services';
import { buildCongesListingConfig } from '../config';

@Component({
  selector: 'app-conge-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './conge-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class CongeListingPage extends ConfigDrivenListingPage<Conge> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(CongeFacade);
  readonly config = buildCongesListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('rh.conge.listing.headerTitle');
}
