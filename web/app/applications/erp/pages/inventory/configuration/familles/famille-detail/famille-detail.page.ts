import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { FamilleArticleFacade } from '../services';
import type { FamilleArticleConfig, FamilleArticleCreate } from '../models';
import { buildFamilleDetailConfig } from '../config';

@Component({
  selector: 'app-famille-article-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './famille-detail.page.html',
  styleUrls: ['./famille-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class FamilleDetailPage extends ConfigDrivenDetailPage<FamilleArticleConfig> {
  private readonly crud = inject(FamilleArticleFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<FamilleArticleConfig, FamilleArticleCreate>({
    crud: this.crud,
  });
  readonly config = buildFamilleDetailConfig(this.translate);

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.configuration.famille.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.famille.headerTitleDetail');
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<FamilleArticleConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
