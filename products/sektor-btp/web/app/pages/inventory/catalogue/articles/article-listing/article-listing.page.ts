import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { ArticlesFacade } from '../services';
import type { ArticleListItem } from '../models';
import { buildArticleListingConfig } from '../config';

@Component({
  selector: 'app-article-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './article-listing.page.html',
  styleUrls: ['./article-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class ArticleListingPage extends ConfigDrivenListingPage<ArticleListItem> {
  readonly facade = inject(ArticlesFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildArticleListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.catalogue.article.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<ArticleListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
