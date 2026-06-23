import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { MotifMouvementFacade } from '../services';
import type { MotifMouvementListItem } from '../models';
import { buildMotifListingConfig } from '../config';

@Component({
  selector: 'app-motif-mouvement-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './motif-listing.page.html',
  styleUrls: ['./motif-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class MotifListingPage extends ConfigDrivenListingPage<MotifMouvementListItem> {
  readonly facade = inject(MotifMouvementFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildMotifListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.configuration.motif.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<MotifMouvementListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
