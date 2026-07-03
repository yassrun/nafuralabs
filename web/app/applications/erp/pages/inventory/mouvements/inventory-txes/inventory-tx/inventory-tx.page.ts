import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenMasterSlavePage,
  ConfigDrivenMasterSlavePageImports,
  ConfigDrivenMasterSlavePageStyles,
  type DetailFacade,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent, DetailPageMode } from '@lib/anatomy/types';
import type { InventoryTx } from '@applications/erp/inventory/models';
import { PerteLinesEditorComponent } from '@applications/erp/inventory/components/perte-lines-editor/perte-lines-editor.component';

import { INVENTORY_TX_LISTING_CONFIG } from '../config/listing';
import { buildInventoryTxDetailConfig } from '../config/detail/detail.config';
import { InventoryTxesFacade } from '../services/inventory-tx.facade';
import { InventoryTxPanelFacade } from '../services/inventory-tx-panel.facade';
import type { InventoryTxListItem } from '../models';

@Component({
  selector: 'app-inventory-tx',
  standalone: true,
  imports: [
    ...ConfigDrivenMasterSlavePageImports,
    FieldTemplateDirective,
    PerteLinesEditorComponent,
    TranslateModule,
  ],
  templateUrl: './inventory-tx.page.html',
  styles: [
    ConfigDrivenMasterSlavePageStyles,
    `
      .tx-panel__empty {
        margin: 2rem;
        color: var(--nf-color-text-secondary, #6b7280);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class InventoryTxPage
  extends ConfigDrivenMasterSlavePage<InventoryTx, InventoryTxListItem>
  implements OnInit
{
  private readonly translate = inject(TranslateService);
  private readonly panelFacade = inject(InventoryTxPanelFacade);

  readonly listingFacade = inject(InventoryTxesFacade);
  readonly detailFacade: DetailFacade<InventoryTx> = {
    loadById: (id) => this.panelFacade.getItem(id),
    create: (data) => this.panelFacade.createItem(data),
    update: (id, data) => this.panelFacade.updateItem(id, data),
    delete: (id) => this.panelFacade.deleteItem(id),
    lookups: () => this.panelFacade.lookups(),
  };

  readonly panelListingConfig = INVENTORY_TX_LISTING_CONFIG;
  readonly panelDetailConfig = buildInventoryTxDetailConfig(this.translate);
  readonly panelRoutes = {
    list: ['/inventory/mouvements/inventory-txes'],
    detail: (id: string) => ['/inventory/mouvements/inventory-txes', id],
    create: ['/inventory/mouvements/inventory-txes/new'],
  };

  get headerTitle(): string {
    return this.translate.instant('inventory.mouvement.tx.headerTitle');
  }
  readonly detailMode = signal<DetailPageMode>('view');
  readonly isCreateRoute = signal(false);

  override ngOnInit(): void {
    if (this.router.url.includes('/new')) {
      this.isCreateRoute.set(true);
      this.selectedId.set(null);
      this.item.set(this.panelFacade.emptyDraft());
      this.detailMode.set('create');
      void this.panelFacade.ensureLookups();
      return;
    }
    super.ngOnInit();
  }

  override onItemsLoaded(items: InventoryTxListItem[]): void {
    if (this.isCreateRoute()) return;
    super.onItemsLoaded(items);
  }

  override onSelectedIdChange(id: string | null): void {
    this.isCreateRoute.set(false);
    super.onSelectedIdChange(id);
  }

  override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    const loaded = this.item();
    this.detailMode.set(loaded?.status === 'BROUILLON' ? 'edit' : 'view');
  }

  override async handleSave(event: DetailActionEvent<InventoryTx>): Promise<void> {
    if (this.isCreateRoute() || this.detailMode() === 'create') {
      this.isSaving.set(true);
      try {
        const saved = await this.detailFacade.create(event.formValue as Partial<InventoryTx>);
        this.isCreateRoute.set(false);
        this.selectedId.set(saved.id);
        this.item.set(saved);
        this.detailMode.set('edit');
        this.showSuccess(
          this.translate.instant('inventory.mouvement.tx.saveSuccess', { number: saved.txNumber }),
        );
        this.detailRef?.markAsPristine();
        await this.router.navigate(this.panelRoutes.detail(saved.id), { replaceUrl: true });
        this.refreshListing();
      } catch {
        this.showError(this.translate.instant('inventory.mouvement.tx.saveError'));
      } finally {
        this.isSaving.set(false);
      }
      return;
    }
    await super.handleSave(event);
    const loaded = this.item();
    if (loaded) {
      this.detailMode.set(loaded.status === 'BROUILLON' ? 'edit' : 'view');
    }
  }
}
