/**
 * ItemPrice Detail Page — Generated once (wrapper file).
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

import { ItemPricesFacade } from '../services';
import type { ItemPrice, ItemPriceCreate } from '../models';
import { ITEM_PRICE_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-item-price-detail',
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
export class ItemPriceDetailPage extends ConfigDrivenDetailPage<ItemPrice> {
  private readonly crud = inject(ItemPricesFacade);
  readonly facade = createDetailFacadeFromCrud<ItemPrice, ItemPriceCreate>({
    crud: this.crud,
  });
  readonly config = ITEM_PRICE_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Item Price';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Item Price Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<ItemPrice>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
