/**
 * InventoryTxLine Detail Page — Generated once (wrapper file).
 * Add custom detail behavior here. This file is never overwritten.
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@platform/lib/anatomy';
import type { DetailActionEvent } from '@platform/lib/anatomy/types';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { InventoryTxLinesFacade } from '../services';
import type { InventoryTxLine, InventoryTxLineCreate } from '../models';
import { INVENTORY_TX_LINE_DETAIL_CONFIG } from '../config';
import { ArticlePickerFieldComponent } from '@app/catalogue/components/article-picker/article-picker-field.component';

@Component({
  selector: 'app-inventory-tx-line-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports, FormsModule, ReactiveFormsModule, ArticlePickerFieldComponent],
  template: `
    <nf-screen [header]="headerConfig" [scroll]="true">
      <nf-entity-detail
        #detail
        [config]="config"
        [mode]="mode()"
        [item]="item()"
        [lookups]="lookups()"
        [loading]="isLoading()"
        [saving]="isSaving()"
        (action)="onAction($event)">
        <ng-template nfField="itemId" let-control>
          <app-article-picker-field [formControl]="$any(control)" context="lookup" />
        </ng-template>
      </nf-entity-detail>
    </nf-screen>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenDetailPageStyles],
})
export class InventoryTxLineDetailPage extends ConfigDrivenDetailPage<InventoryTxLine> {
  private readonly crud = inject(InventoryTxLinesFacade);
  readonly facade = createDetailFacadeFromCrud<InventoryTxLine, InventoryTxLineCreate>({
    crud: this.crud,
  });
  readonly config = INVENTORY_TX_LINE_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Inventory Tx Line';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Inventory Tx Line Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<InventoryTxLine>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
