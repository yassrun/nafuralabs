import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';

import type { AppelOffreClient } from '@app/etudes/models';

import { AOCFacade } from '../services';
import { buildAocListingConfig } from '../config';

@Component({
  selector: 'app-aoc-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './aoc-listing.page.html',
  styleUrls: ['./aoc-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class AOCListingPage extends ConfigDrivenListingPage<AppelOffreClient> {
  readonly facade = inject(AOCFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildAocListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.appelOffreClient.title');
}
