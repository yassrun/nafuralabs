import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent } from '@lib/anatomy/types';

import type {
  Devis,
  DevisCreate,
  DevisLigne,
} from '@applications/erp/etudes/models';
import { DpgfEditorComponent } from '@applications/erp/etudes/components/dpgf-editor/dpgf-editor.component';
import { ButtonComponent } from '@lib/anatomy/components/atoms/button/button.component';
import { ExportService } from '@lib/anatomy/services/export.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { DevisFacade } from '../services';
import { DEVIS_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-devis-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    DpgfEditorComponent,
    ButtonComponent,
    MadCurrencyPipe,
  ],
  templateUrl: './devis-detail.page.html',
  styleUrls: ['./devis-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class DevisDetailPage extends ConfigDrivenDetailPage<Devis> {
  private readonly crud = inject(DevisFacade);
  private readonly nav = inject(Router);
  private readonly exportService = inject(ExportService);
  private readonly audit = inject(ErpAuditService);

  readonly facade = createDetailFacadeFromCrud<Devis, DevisCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = DEVIS_DETAIL_CONFIG;

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouveau devis';
    const item = this.item();
    return item
      ? `${item.numero} V${item.version} — ${item.objet ?? ''}`
      : 'Détail devis';
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  lignesValue(item: Devis | null): DevisLigne[] {
    return (item?.lignes ?? []) as DevisLigne[];
  }

  onLignesChange(control: unknown, value: DevisLigne[]): void {
    (control as FormControl).setValue(value);
    (control as FormControl).markAsDirty();
  }

  printDevis(): void {
    const d = this.item();
    if (!d) return;
    this.exportService.printPage();
    this.audit.log('PRINT', 'DEVIS', d.id, d.numero, `V${d.version}`);
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Devis>,
  ): Promise<void> {
    const item = event.item;

    if (event.actionId === 'new_version' && item) {
      const result = await this.confirmDialog.prompt({
        title: 'Modifications apportées dans cette nouvelle version :',
        fields: [{ key: 'modifications', label: 'Modifications', required: false }],
        confirmLabel: 'OK',
        cancelLabel: 'Annuler',
      });
      if (!result) return;
      const modifications = result['modifications'] ?? '';
      const created = await this.crud.newVersion(item.id, modifications);
      this.nav.navigate(['/etudes/devis', created.id]);
      return;
    }

    if (event.actionId === 'print_pdf' && item) {
      window.print();
      return;
    }

    if (event.actionId === 'convert_chantier' && item) {
      this.nav.navigate(['/chantiers/new'], {
        queryParams: { devisId: item.id },
      });
      return;
    }

    await super.handleCustomAction(event);
  }
}
