import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { TypeArticleFacade } from '../services';
import type { TypeArticleListItem } from '../models';
import { buildTypeArticleListingConfig } from '../config';

@Component({
  selector: 'app-type-article-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './type-article-listing.page.html',
  styleUrls: ['./type-article-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class TypeArticleListingPage extends ConfigDrivenListingPage<TypeArticleListItem> {
  readonly facade = inject(TypeArticleFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildTypeArticleListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.configuration.typeArticle.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<TypeArticleListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
