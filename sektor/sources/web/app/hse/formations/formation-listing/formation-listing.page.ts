
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { Formation } from '@app/hse/models';

import { FormationFacade } from '../services';
import { buildFormationsListingConfig } from '../config';

@Component({
  selector: 'app-formation-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './formation-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class FormationListingPage extends ConfigDrivenListingPage<Formation> {
  readonly facade = inject(FormationFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildFormationsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('hse.formation.headerTitle');
}
