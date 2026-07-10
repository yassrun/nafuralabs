import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { UomFacade } from '../services';
import type { UomConfig, UomCreate } from '../models';
import { buildUomDetailConfig } from '../config';

@Component({
  selector: 'app-uom-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './uom-detail.page.html',
  styleUrls: ['./uom-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class UomDetailPage extends ConfigDrivenDetailPage<UomConfig> {
  private readonly crud = inject(UomFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<UomConfig, UomCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildUomDetailConfig(this.translate);

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.configuration.uom.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.uom.headerTitleDetail');
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<UomConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
