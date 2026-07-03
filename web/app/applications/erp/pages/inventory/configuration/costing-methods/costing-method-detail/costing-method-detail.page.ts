import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { CostingMethodFacade } from '../services';
import type { CostingMethodConfig, CostingMethodCreate } from '../models';
import { buildCostingMethodDetailConfig } from '../config';

@Component({
  selector: 'app-costing-method-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './costing-method-detail.page.html',
  styleUrls: ['./costing-method-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class CostingMethodDetailPage extends ConfigDrivenDetailPage<CostingMethodConfig> {
  private readonly crud = inject(CostingMethodFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<CostingMethodConfig, CostingMethodCreate>({
    crud: this.crud,
  });
  readonly config = buildCostingMethodDetailConfig(this.translate);

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.configuration.costingMethod.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.costingMethod.headerTitleDetail');
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<CostingMethodConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
