import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../inventory/models';
import { PerteLinesEditorComponent } from '../../../../inventory/components/perte-lines-editor/perte-lines-editor.component';

import { buildPerteDetailConfig } from './config/detail/detail.config';
import { PerteFacade } from './services/perte.facade';

@Component({
  selector: 'app-perte-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    PerteLinesEditorComponent,
  ],
  templateUrl: './perte-detail.page.html',
  styleUrls: ['./perte-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class PerteDetailPage extends ConfigDrivenDetailPage<InventoryTx> {
  private readonly crud = inject(PerteFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<InventoryTx, Partial<InventoryTx>>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildPerteDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('inventory.mouvement.perte.headerTitleNew');
    return this.item()?.txNumber ?? this.translate.instant('inventory.mouvement.perte.headerTitleDetailFallback');
  }

  protected override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    this.mode.set('view');
  }

  protected override async handleSave(event: DetailActionEvent<InventoryTx>): Promise<void> {
    this.isSaving.set(true);
    try {
      let saved: InventoryTx;
      if (this.mode() === 'create') {
        saved = await this.facade.create(event.formValue as InventoryTx);
        this.item.set(saved);
        this.itemId.set(saved.id);
        this.mode.set(saved.status === 'VALIDE' ? 'view' : 'edit');
        this.router.navigate(['/inventory/mouvements/pertes-chutes', saved.id], { replaceUrl: true });
        this.showSuccess(this.translate.instant('inventory.mouvement.perte.saveSuccess'));
      } else {
        const id = this.itemId();
        // @i18n-exempt — internal sanity check, caught and replaced by saveErrorMessage
        if (!id) throw new Error('No item ID');
        saved = await this.facade.update(id, event.formValue as InventoryTx);
        this.item.set(saved);
        this.showSuccess(
          typeof this.config.saveSuccessMessage === 'function'
            ? this.config.saveSuccessMessage(saved)
            : (this.config.saveSuccessMessage ?? this.translate.instant('inventory.mouvement.perte.saveSuccess')),
        );
      }
      this.detailComponent?.markAsPristine();
    } catch {
      this.showError(
        this.config.saveErrorMessage ?? this.translate.instant('inventory.mouvement.perte.saveErrorDefault'),
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected override async handleCustomAction(event: DetailActionEvent<InventoryTx>): Promise<void> {
    if (event.actionId === 'enter_edit') {
      this.mode.set('edit');
      return;
    }

    const id = this.itemId();
    if (!id) return;

    if (event.actionId === 'validate') {
      const ok = await this.confirmDialog.confirm({
        title: this.translate.instant('inventory.mouvement.perte.transitions.validateTitle'),
        message: this.translate.instant('inventory.mouvement.perte.transitions.validateMessage'),
        confirmLabel: this.translate.instant('inventory.mouvement.perte.transitions.validateConfirm'),
        cancelLabel: this.translate.instant('inventory.mouvement.perte.transitions.validateCancel'),
        variant: 'default',
      });
      if (!ok) return;

      this.isSaving.set(true);
      try {
        const updated = await this.crud.validate(id);
        this.item.set(updated);
        this.mode.set('view');
        this.showSuccess(this.translate.instant('inventory.mouvement.perte.validateSuccess'));
        this.detailComponent?.markAsPristine();
      } catch {
        this.showError(this.translate.instant('inventory.mouvement.perte.validateError'));
      } finally {
        this.isSaving.set(false);
      }
      return;
    }

    await super.handleCustomAction(event);
  }
}
