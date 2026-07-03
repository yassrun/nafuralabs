import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud, ButtonComponent} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import { DateLocalizedPipe } from '@lib/anatomy/pipes';
import type {
  DetailActionEvent,
  StatusTransitionEvent,
} from '@lib/anatomy/types';

import type {
  FactureClient,
  FactureCreate,
  FactureLigne,
  Encaissement,
} from '@applications/erp/ventes/models';
import {
  EncaissementFormDialogComponent,
  FacturePrintComponent,
  type EncaissementDialogData,
  type EncaissementDialogResult,
} from '@applications/erp/ventes/components';

import { FactureFacade } from '../services';
import { buildFactureDetailConfig } from '../config';

const MODE_PAIEMENT_KEYS: Record<string, string> = {
  VIREMENT: 'ventes.modePaiement.virement',
  CHEQUE: 'ventes.modePaiement.cheque',
  EFFET: 'ventes.modePaiement.effet',
  ESPECES: 'ventes.modePaiement.especes',
  COMPENSATION: 'ventes.modePaiement.compensation',
};

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [
    ButtonComponent,
    ...ConfigDrivenDetailPageImports,
    CommonModule,
    MadCurrencyPipe,
    FieldTemplateDirective,
    MatButtonModule,
    MatIconModule,
    FacturePrintComponent,
    TranslateModule,
    DateLocalizedPipe,
  ],
  templateUrl: './facture-detail.page.html',
  styleUrls: ['./facture-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class FactureDetailPage extends ConfigDrivenDetailPage<FactureClient> {
  private readonly crud = inject(FactureFacade);
  private readonly nav = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<FactureClient, FactureCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildFactureDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create')
      return this.translate.instant('ventes.facture.createTitle');
    const item = this.item();
    return item
      ? `${item.numero} — ${item.clientName ?? ''}`
      : this.translate.instant('ventes.facture.detailTitle');
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  lignesValue(item: FactureClient | null): FactureLigne[] {
    return (item?.lignes ?? []) as FactureLigne[];
  }

  encaissementsValue(item: FactureClient | null): Encaissement[] {
    return (item?.encaissements ?? []) as Encaissement[];
  }

  formatModePaiement(mode?: string): string {
    if (!mode) return '—';
    const key = MODE_PAIEMENT_KEYS[mode];
    if (!key) return mode;
    const translated = this.translate.instant(key);
    return translated === key ? mode : translated;
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<FactureClient>,
  ): Promise<void> {
    const item = event.item;

    if (event.actionId === 'add_encaissement' && item) {
      await this.openEncaissementDialog(item);
      return;
    }

    if (event.actionId === 'print_facture' && item) {
      window.print();
      return;
    }

    if (event.actionId === 'creer_avoir' && item) {
      this.nav.navigate(['/ventes/avoirs/new'], {
        queryParams: { factureId: item.id },
      });
      return;
    }

    await super.handleCustomAction(event);
  }

  override async handleTransition(
    event: StatusTransitionEvent,
  ): Promise<void> {
    const id = this.itemId();
    if (!id) return;
    let updated: FactureClient | null = null;
    switch (event.action) {
      case 'emit':
        updated = await this.crud.emit(String(id));
        break;
      case 'litige': {
        const motif = event.note?.trim();
        if (!motif) return;
        updated = await this.crud.litige(String(id), motif);
        break;
      }
      case 'resoudre_litige':
        updated = await this.crud.resoudreLitige(String(id));
        break;
      case 'cancel':
        updated = await this.crud.cancel(String(id));
        break;
      default:
        await super.handleTransition(event);
        return;
    }
    if (updated) {
      this.item.set(updated);
    }
  }

  private async openEncaissementDialog(facture: FactureClient): Promise<void> {
    const banques = (this.lookups()['banques'] ?? []).map((b) => ({
      id: b.key as string,
      nom: b.value,
    }));
    const dialogRef = this.dialog.open<
      EncaissementFormDialogComponent,
      EncaissementDialogData,
      EncaissementDialogResult
    >(EncaissementFormDialogComponent, {
      data: { facture, banques },
      maxWidth: '720px',
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (!result) return;
    const updated = await this.crud.addEncaissement(facture.id, result);
    this.item.set(updated);
  }

  async removeEncaissement(encaissementId: string): Promise<void> {
    const item = this.item();
    if (!item) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('ventes.facture.confirm.removeEncaissement'),
      message: ' ',
      confirmLabel: this.translate.instant('common.actions.delete'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    const updated = await this.crud.removeEncaissement(item.id, encaissementId);
    this.item.set(updated);
  }
}
