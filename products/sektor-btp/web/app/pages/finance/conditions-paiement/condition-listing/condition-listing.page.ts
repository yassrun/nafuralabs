import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { ConditionPaiement } from '@applications/erp/finance/models';

import { ConditionPaiementFacade } from '../services';
import { buildConditionPaiementListingConfig } from '../config';

@Component({
  selector: 'app-condition-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-listing
        #listing
        [config]="config"
        [facade]="facade"
        (action)="onAction($event)">
      </nf-entity-listing>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenListingPageStyles],
})
export class ConditionListingPage extends ConfigDrivenListingPage<ConditionPaiement> {
  readonly facade = inject(ConditionPaiementFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildConditionPaiementListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('finance.conditionPaiement.title');
}
