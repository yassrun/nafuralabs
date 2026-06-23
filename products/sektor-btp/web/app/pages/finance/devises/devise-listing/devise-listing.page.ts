import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { Devise } from '@applications/erp/finance/models';

import { DeviseFacade } from '../services';
import { buildDeviseListingConfig } from '../config';

@Component({
  selector: 'app-devise-listing',
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
export class DeviseListingPage extends ConfigDrivenListingPage<Devise> {
  private readonly translate = inject(TranslateService);

  readonly facade = inject(DeviseFacade);
  readonly config = buildDeviseListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('finance.devise.entityNamePlural');
}
