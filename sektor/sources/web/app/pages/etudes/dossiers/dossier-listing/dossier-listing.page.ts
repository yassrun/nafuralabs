import { Component, inject } from '@angular/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { DossierEtude } from '@app/etudes/models';

import { DossierEtudeFacade } from '../services/dossier-etude.facade';
import { buildDossierListingConfig } from '../config/listing.config';

@Component({
  selector: 'app-dossier-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './dossier-listing.page.html',
  styleUrls: ['./dossier-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class DossierListingPage extends ConfigDrivenListingPage<DossierEtude> {
  readonly facade = inject(DossierEtudeFacade);
  readonly config = buildDossierListingConfig();
  readonly headerTitle = "Études / appels d'offres";
}
