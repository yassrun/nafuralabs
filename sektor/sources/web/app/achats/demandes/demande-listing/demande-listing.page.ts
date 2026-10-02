
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles} from '@platform/lib/anatomy';
import type { DemandeAchat } from '@app/achats/models';

import { DemandeFacade } from '../services';
import { buildDemandesListingConfig } from '../config';

@Component({
  selector: 'app-demande-listing',
  standalone: true,
  imports: [
    ...ConfigDrivenListingPageImports
],
  templateUrl: './demande-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class DemandeListingPage extends ConfigDrivenListingPage<DemandeAchat> {
  readonly facade = inject(DemandeFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildDemandesListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.demande.headerTitle');
}
