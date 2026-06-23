import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { MaterielFacade } from '../services';
import type { MaterielListItem } from '../models';
import { buildMaterielListingConfig } from '../config';
import { PARC_ROUTES } from '../config/listing/parc-routes';

@Component({
  selector: 'app-materiel-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './materiel-listing.page.html',
  styleUrls: ['./materiel-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class MaterielListingPage extends ConfigDrivenListingPage<MaterielListItem> {
  readonly facade = inject(MaterielFacade);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  readonly config = buildMaterielListingConfig(
    this.translate,
    this.router.url.startsWith('/materiel/parc') ? PARC_ROUTES : undefined,
  );
  readonly headerTitle = this.translate.instant('inventory.catalogue.materiel.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<MaterielListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
