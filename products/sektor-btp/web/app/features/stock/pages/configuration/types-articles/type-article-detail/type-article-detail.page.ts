import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { TypeArticleFacade } from '../services';
import type { TypeArticleConfig, TypeArticleCreate } from '../models';
import { buildTypeArticleDetailConfig } from '../config';

@Component({
  selector: 'app-type-article-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './type-article-detail.page.html',
  styleUrls: ['./type-article-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class TypeArticleDetailPage extends ConfigDrivenDetailPage<TypeArticleConfig> {
  private readonly crud = inject(TypeArticleFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<TypeArticleConfig, TypeArticleCreate>({
    crud: this.crud,
  });
  readonly config = buildTypeArticleDetailConfig(this.translate);

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.configuration.typeArticle.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.typeArticle.headerTitleDetail');
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<TypeArticleConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
