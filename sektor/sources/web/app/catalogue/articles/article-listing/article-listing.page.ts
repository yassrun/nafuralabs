import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ToastService,
} from '@platform/lib/anatomy';
import type { ListingActionEvent } from '@platform/lib/anatomy/types';
import type { ReviewedExtraction } from '@platform/app/document-extraction/smart-import';
import { ArticleImportService } from '@app/socle/shared/smart-import/handlers/article-import.handler';

import { ArticlesFacade } from '../services';
import type { ArticleListItem } from '../models';
import { buildArticleListingConfig } from '../config';

@Component({
  selector: 'app-article-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './article-listing.page.html',
  styleUrls: ['./article-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class ArticleListingPage extends ConfigDrivenListingPage<ArticleListItem> {
  readonly facade = inject(ArticlesFacade);
  private readonly translate = inject(TranslateService);
  private readonly importer = inject(ArticleImportService);
  private readonly smartImportToast = inject(ToastService);
  readonly config = buildArticleListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.catalogue.article.headerTitle');

  async onSmartImportComplete(result: ReviewedExtraction): Promise<void> {
    try {
      const importResult = await this.importer.import(result.data);
      this.listingComponent?.refresh();
      this.smartImportToast.success(
        `${importResult.created} article(s) ajouté(s), ${importResult.skippedDuplicates} doublon(s) ignoré(s).`,
      );
    } catch (error) {
      console.error('[article-smart-import]', error);
      this.smartImportToast.error('Impossible d’ajouter les articles extraits.');
    }
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<ArticleListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
