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
import type { DetailActionEvent } from '@lib/anatomy/types';

import type { InventaireTx } from '../../../../inventory/models';
import { InventaireLinesEditorComponent } from '../../../../inventory/components/inventaire-lines-editor/inventaire-lines-editor.component';

import { buildInventaireDetailConfig } from './config/detail/detail.config';
import { InventaireFacade } from './services/inventaire.facade';

@Component({
  selector: 'app-inventaire-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    InventaireLinesEditorComponent,
  ],
  templateUrl: './inventaire-detail.page.html',
  styleUrls: ['./inventaire-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class InventaireDetailPage extends ConfigDrivenDetailPage<InventaireTx> {
  private readonly crud = inject(InventaireFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<InventaireTx, Partial<InventaireTx>>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildInventaireDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('inventory.mouvement.inventaire.headerTitleNew');
    return this.item()?.txNumber ?? this.translate.instant('inventory.mouvement.inventaire.headerTitleDetailFallback');
  }

  asHeaderForm(form: unknown): FormGroup | null {
    return form instanceof FormGroup ? form : null;
  }

  protected override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    this.mode.set('view');
  }

  protected override async handleSave(event: DetailActionEvent<InventaireTx>): Promise<void> {
    this.isSaving.set(true);
    try {
      let saved: InventaireTx;
      if (this.mode() === 'create') {
        saved = await this.facade.create(event.formValue as InventaireTx);
        this.item.set(saved);
        this.itemId.set(saved.id);
        this.mode.set(saved.status === 'VALIDE' ? 'view' : 'edit');
        this.router.navigate(['/inventory/mouvements/inventaires', saved.id], { replaceUrl: true });
        this.showSuccess(this.translate.instant('inventory.mouvement.inventaire.saveSuccess'));
      } else {
        const id = this.itemId();
        // @i18n-exempt — internal sanity check, caught and replaced by saveErrorMessage
        if (!id) throw new Error('No item ID');
        saved = await this.facade.update(id, event.formValue as InventaireTx);
        this.item.set(saved);
        this.showSuccess(
          typeof this.config.saveSuccessMessage === 'function'
            ? this.config.saveSuccessMessage(saved)
            : (this.config.saveSuccessMessage ?? this.translate.instant('inventory.mouvement.inventaire.saveSuccess')),
        );
      }
      this.detailComponent?.markAsPristine();
    } catch {
      this.showError(
        this.config.saveErrorMessage ?? this.translate.instant('inventory.mouvement.inventaire.saveErrorDefault'),
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected override async handleCustomAction(event: DetailActionEvent<InventaireTx>): Promise<void> {
    if (event.actionId === 'enter_edit') {
      this.mode.set('edit');
      return;
    }

    const id = this.itemId();
    if (!id) return;

    if (event.actionId === 'validate') {
      this.isSaving.set(true);
      try {
        const updated = await this.crud.validate(id);
        this.item.set(updated);
        this.mode.set('view');
        this.showSuccess(this.translate.instant('inventory.mouvement.inventaire.validateSuccess'));
        this.detailComponent?.markAsPristine();
      } catch {
        this.showError(this.translate.instant('inventory.mouvement.inventaire.validateError'));
      } finally {
        this.isSaving.set(false);
      }
      return;
    }

    await super.handleCustomAction(event);
  }
}
