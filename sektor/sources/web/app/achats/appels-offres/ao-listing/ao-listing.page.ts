
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles} from '@platform/lib/anatomy';
import type { AppelOffre } from '@app/achats/models';

import { AoFacade } from '../services';
import { buildAoListingConfig } from '../config';

@Component({
  selector: 'app-ao-listing',
  standalone: true,
  imports: [
    ...ConfigDrivenListingPageImports
],
  templateUrl: './ao-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class AoListingPage extends ConfigDrivenListingPage<AppelOffre> {
  readonly facade = inject(AoFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildAoListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.appelOffre.headerTitle');
}
