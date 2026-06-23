import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { UomCategoryFacade } from '../services';
import type { UomCategoryConfig, UomCategoryCreate } from '../models';
import { buildUomCategoryDetailConfig } from '../config';

@Component({
  selector: 'app-uom-category-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './uom-category-detail.page.html',
  styleUrls: ['./uom-category-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class UomCategoryDetailPage extends ConfigDrivenDetailPage<UomCategoryConfig> {
  private readonly crud = inject(UomCategoryFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<UomCategoryConfig, UomCategoryCreate>({
    crud: this.crud,
  });
  readonly config = buildUomCategoryDetailConfig(this.translate);

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.configuration.uomCategory.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.uomCategory.headerTitleDetail');
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<UomCategoryConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
