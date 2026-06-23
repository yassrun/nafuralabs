import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { Ouvrage } from '@applications/erp/etudes/models';

import { OuvrageFacade } from '../services';
import { buildOuvrageListingConfig } from '../config';

@Component({
  selector: 'app-ouvrage-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './ouvrage-listing.page.html',
  styleUrls: ['./ouvrage-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class OuvrageListingPage extends ConfigDrivenListingPage<Ouvrage> {
  readonly facade = inject(OuvrageFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildOuvrageListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.bibliothequePrix.title');
}
