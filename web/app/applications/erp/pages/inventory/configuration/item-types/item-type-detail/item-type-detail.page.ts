/**
 * ItemType Detail Page — Generated once (wrapper file).
 * Add custom detail behavior here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { ItemTypesFacade } from '../services';
import type { ItemType, ItemTypeCreate } from '../models';
import { ITEM_TYPE_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-item-type-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-detail
        #detail
        [config]="config"
        [mode]="mode()"
        [item]="item()"
        [lookups]="lookups()"
        [loading]="isLoading()"
        [saving]="isSaving()"
        (action)="onAction($event)">
      </nf-entity-detail>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenDetailPageStyles],
})
export class ItemTypeDetailPage extends ConfigDrivenDetailPage<ItemType> {
  private readonly crud = inject(ItemTypesFacade);
  readonly facade = createDetailFacadeFromCrud<ItemType, ItemTypeCreate>({
    crud: this.crud,
  });
  readonly config = ITEM_TYPE_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Item Type';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Item Type Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<ItemType>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
