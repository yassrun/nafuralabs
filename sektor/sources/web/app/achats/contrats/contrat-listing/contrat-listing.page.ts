
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage, ConfigDrivenListingPageImports, ConfigDrivenListingPageStyles} from '@platform/lib/anatomy';
import type { ContratAchat } from '@app/achats/models';

import { ContratFacade } from '../services';
import { buildContratsListingConfig } from '../config';

@Component({
  selector: 'app-contrat-listing',
  standalone: true,
  imports: [
    ...ConfigDrivenListingPageImports
],
  templateUrl: './contrat-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class ContratListingPage extends ConfigDrivenListingPage<ContratAchat> {
  readonly facade = inject(ContratFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildContratsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.contrat.headerTitle');
}
