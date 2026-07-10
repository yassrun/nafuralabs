import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { MotifMouvementFacade } from '../services';
import type { MotifMouvementConfig, MotifMouvementCreate } from '../models';
import { buildMotifDetailConfig } from '../config';

@Component({
  selector: 'app-motif-mouvement-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './motif-detail.page.html',
  styleUrls: ['./motif-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class MotifDetailPage extends ConfigDrivenDetailPage<MotifMouvementConfig> {
  private readonly crud = inject(MotifMouvementFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<MotifMouvementConfig, MotifMouvementCreate>({
    crud: this.crud,
  });
  readonly config = buildMotifDetailConfig(this.translate);

  get headerTitle(): string {
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.motif.headerTitleDetail');
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<MotifMouvementConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
