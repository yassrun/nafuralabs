import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { LocationConfigFacade } from '../services';
import type { LocationConfig, LocationConfigCreate } from '../models';
import { buildDepotDetailConfig } from '../config';

@Component({
  selector: 'app-location-config-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './location-detail.page.html',
  styleUrls: ['./location-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class LocationDetailPage extends ConfigDrivenDetailPage<LocationConfig> {
  private readonly crud = inject(LocationConfigFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<LocationConfig, LocationConfigCreate>({
    crud: this.crud,
  });
  readonly config = buildDepotDetailConfig(this.translate);

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.configuration.depot.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.depot.headerTitleDetail');
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<LocationConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
