import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent, StatusTransitionEvent } from '@lib/anatomy/types';

import type { InventoryTx, InventoryTxLine } from '../../../../inventory/models';
import { RetourLinesEditorComponent } from '../../../../inventory/components/retour-lines-editor/retour-lines-editor.component';

import { buildRetourDetailConfig } from './config/detail/detail.config';
import { RetourFacade } from './services/retour.facade';

@Component({
  selector: 'app-retour-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    RetourLinesEditorComponent,
  ],
  templateUrl: './retour-detail.page.html',
  styleUrls: ['./retour-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class RetourDetailPage extends ConfigDrivenDetailPage<InventoryTx> {
  private readonly crud = inject(RetourFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<InventoryTx, Partial<InventoryTx>>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildRetourDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('inventory.mouvement.retour.headerTitleNew');
    return this.item()?.txNumber ?? this.translate.instant('inventory.mouvement.retour.headerTitleDetailFallback');
  }

  asLinesControl(control: unknown): FormControl<InventoryTxLine[] | null> {
    return control as FormControl<InventoryTxLine[] | null>;
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
        this.mode.set(saved.status === 'VALIDE' || saved.status === 'ANNULE' ? 'view' : 'edit');
        this.router.navigate(['/inventory/mouvements/retours', saved.id], { replaceUrl: true });
        this.showSuccess(this.translate.instant('inventory.mouvement.retour.saveSuccess'));
      } else {
        const id = this.itemId();
        // @i18n-exempt — internal sanity check, caught and replaced by saveErrorMessage
        if (!id) throw new Error('No item ID');
        saved = await this.facade.update(id, event.formValue as InventoryTx);
        this.item.set(saved);
        this.showSuccess(
          typeof this.config.saveSuccessMessage === 'function'
            ? this.config.saveSuccessMessage(saved)
            : (this.config.saveSuccessMessage ?? this.translate.instant('inventory.mouvement.retour.saveSuccess')),
        );
      }
      this.detailComponent?.markAsPristine();
    } catch {
      this.showError(
        this.config.saveErrorMessage ?? this.translate.instant('inventory.mouvement.retour.saveErrorDefault'),
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

    await super.handleCustomAction(event);
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;

    this.isTransitioning.set(true);
    try {
      let updated: InventoryTx;

      if (event.action === 'validate') {
        updated = await this.crud.validate(id);
        this.showSuccess(this.translate.instant('inventory.mouvement.retour.validateSuccess'));
      } else if (event.action === 'cancel') {
        updated = await this.crud.reject(id);
        this.showSuccess(this.translate.instant('inventory.mouvement.retour.cancelSuccess'));
      } else {
        this.showError(this.translate.instant('inventory.mouvement.common.transitionUnknown', { action: event.action }));
        return;
      }

      this.item.set(updated);
      this.mode.set('view');
      this.detailComponent?.markAsPristine();
    } catch {
      this.showError(this.translate.instant('inventory.mouvement.common.transitionFailed'));
    } finally {
      this.isTransitioning.set(false);
    }
  }
}
