
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles} from '@platform/lib/anatomy';
import type { OffreCommerciale } from '@app/ventes/models';

import { OffreFacade } from '../services';
import { buildOffreListingConfig } from '../config';

@Component({
  selector: 'app-offre-listing',
  standalone: true,
  imports: [
    ...ConfigDrivenListingPageImports
],
  templateUrl: './offre-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class OffreListingPage extends ConfigDrivenListingPage<OffreCommerciale> {
  readonly facade = inject(OffreFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildOffreListingConfig(this.translate);
  readonly headerTitle = 'Offres commerciales';
}
