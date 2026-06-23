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

import { buildSortieDetailConfig } from './config/detail/detail.config';
import { SortieFacade } from './services/sortie.facade';

@Component({
  selector: 'app-sortie-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports, FieldTemplateDirective, PerteLinesEditorComponent],
  templateUrl: './sortie-detail.page.html',
  styleUrls: ['./sortie-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class SortieDetailPage extends ConfigDrivenDetailPage<InventoryTx> {
  private readonly crud = inject(SortieFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<InventoryTx, Partial<InventoryTx>>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildSortieDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('inventory.mouvement.sortie.headerTitleNew');
    return this.item()?.txNumber ?? this.translate.instant('inventory.mouvement.sortie.headerTitleDetailFallback');
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
        this.router.navigate(['/inventory/mouvements/sorties', saved.id], { replaceUrl: true });
        this.showSuccess(this.translate.instant('inventory.mouvement.sortie.saveSuccess'));
      } else {
        const id = this.itemId();
        // @i18n-exempt — internal sanity check, caught and replaced by saveErrorMessage
        if (!id) throw new Error('No item ID');
        saved = await this.facade.update(id, event.formValue as InventoryTx);
        this.item.set(saved);
        this.showSuccess(
          typeof this.config.saveSuccessMessage === 'function'
            ? this.config.saveSuccessMessage(saved)
            : (this.config.saveSuccessMessage ?? this.translate.instant('inventory.mouvement.sortie.saveSuccess')),
        );
      }
      this.detailComponent?.markAsPristine();
    } catch {
      this.showError(
        this.config.saveErrorMessage ?? this.translate.instant('inventory.mouvement.sortie.saveErrorDefault'),
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
        title: this.translate.instant('inventory.mouvement.sortie.transitions.validateTitle'),
        message: this.translate.instant('inventory.mouvement.sortie.transitions.validateMessage'),
        confirmLabel: this.translate.instant('inventory.mouvement.sortie.transitions.validateConfirm'),
        cancelLabel: this.translate.instant('inventory.mouvement.sortie.transitions.validateCancel'),
        variant: 'default',
      });
      if (!ok) return;

      this.isSaving.set(true);
      try {
        const updated = await this.crud.validate(id);
        this.item.set(updated);
        this.mode.set('view');
        this.showSuccess(this.translate.instant('inventory.mouvement.sortie.validateSuccess'));
        this.detailComponent?.markAsPristine();
      } catch {
        this.showError(this.translate.instant('inventory.mouvement.sortie.validateError'));
      } finally {
        this.isSaving.set(false);
      }
      return;
    }

    await super.handleCustomAction(event);
  }
}
