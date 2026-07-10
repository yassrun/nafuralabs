import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { FamilleArticleFacade } from '../services';
import type { FamilleArticleListItem } from '../models';
import { buildFamilleListingConfig } from '../config';

@Component({
  selector: 'app-famille-article-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './famille-listing.page.html',
  styleUrls: ['./famille-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class FamilleListingPage extends ConfigDrivenListingPage<FamilleArticleListItem> {
  readonly facade = inject(FamilleArticleFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildFamilleListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.configuration.famille.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<FamilleArticleListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
