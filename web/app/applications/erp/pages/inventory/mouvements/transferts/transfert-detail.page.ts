import { Component, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent, StatusTransitionEvent } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../inventory/models';
import { TransfertLinesEditorComponent } from '../../../../inventory/components/transfert-lines-editor/transfert-lines-editor.component';
import { buildTransfertDetailConfig } from './config/detail/detail.config';
import { TransfertFacade } from './services/transfert.facade';

@Component({
  selector: 'app-transfert-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    TransfertLinesEditorComponent,
  ],
  templateUrl: './transfert-detail.page.html',
  styleUrls: ['./transfert-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class TransfertDetailPage extends ConfigDrivenDetailPage<InventoryTx> {
  private readonly crud = inject(TransfertFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<InventoryTx, Partial<InventoryTx>>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildTransfertDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('inventory.mouvement.transfert.headerTitleNew');
    return this.item()?.txNumber ?? this.translate.instant('inventory.mouvement.transfert.headerTitleDetailFallback');
  }

  asHeaderForm(form: unknown): FormGroup | null {
    return form instanceof FormGroup ? form : null;
  }

  protected override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    this.mode.set('view');
  }

  protected override async handleSave(event: DetailActionEvent<InventoryTx>): Promise<void> {
    const formValue = { ...(event.formValue as InventoryTx) };
    if (formValue.chantierLocationId) {
      formValue.destLocationId = formValue.chantierLocationId;
    }

    if (
      formValue.sourceLocationId &&
      formValue.destLocationId &&
      formValue.sourceLocationId === formValue.destLocationId
    ) {
      this.showError(this.translate.instant('inventory.mouvement.transfert.destDiffSource'));
      return;
    }

    this.isSaving.set(true);
    try {
      let saved: InventoryTx;
      if (this.mode() === 'create') {
        saved = await this.facade.create(formValue);
        this.item.set(saved);
        this.itemId.set(saved.id);
        this.mode.set(saved.status === 'VALIDE' || saved.status === 'ANNULE' ? 'view' : 'edit');
        this.router.navigate(['/inventory/mouvements/transferts', saved.id], { replaceUrl: true });
        this.showSuccess(this.translate.instant('inventory.mouvement.transfert.saveSuccess'));
      } else {
        const id = this.itemId();
        // @i18n-exempt — internal sanity check, caught and replaced by saveErrorMessage
        if (!id) throw new Error('No item ID');
        saved = await this.facade.update(id, formValue);
        this.item.set(saved);
        this.showSuccess(
          typeof this.config.saveSuccessMessage === 'function'
            ? this.config.saveSuccessMessage(saved)
            : (this.config.saveSuccessMessage ?? this.translate.instant('inventory.mouvement.transfert.saveSuccess')),
        );
      }
      this.detailComponent?.markAsPristine();
    } catch {
      this.showError(
        this.config.saveErrorMessage ?? this.translate.instant('inventory.mouvement.transfert.saveErrorDefault'),
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
        this.showSuccess(this.translate.instant('inventory.mouvement.transfert.validateSuccess'));
      } else if (event.action === 'cancel') {
        updated = await this.crud.cancelDraft(id);
        this.showSuccess(this.translate.instant('inventory.mouvement.transfert.cancelSuccess'));
      } else {
        this.showError(this.translate.instant('inventory.mouvement.common.transitionUnknown', { action: event.action }));
        return;
      }

      this.item.set(updated);
      this.mode.set('view');
      this.detailComponent?.markAsPristine();
    } catch (err) {
      this.showError((err as Error).message ?? this.translate.instant('inventory.mouvement.common.transitionFailed'));
    } finally {
      this.isTransitioning.set(false);
    }
  }
}
