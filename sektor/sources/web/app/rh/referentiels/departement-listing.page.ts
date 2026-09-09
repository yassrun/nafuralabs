import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { RhNomenclature } from '@app/rh/models';

import { buildNomenclatureListingConfig } from './config/listing';
import { RhDepartementFacade } from './services';

@Component({
  selector: 'app-rh-departement-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-listing #listing [config]="config" [facade]="facade" (action)="onAction($event)">
      </nf-entity-listing>
    </nf-page-shell>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class RhDepartementListingPage extends ConfigDrivenListingPage<RhNomenclature> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(RhDepartementFacade);
  readonly config = buildNomenclatureListingConfig(this.translate, 'departement');
  readonly headerTitle = this.translate.instant('rh.departement.listing.headerTitle');
}
