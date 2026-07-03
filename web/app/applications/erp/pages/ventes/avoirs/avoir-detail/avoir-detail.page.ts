import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type {
  DetailActionEvent,
  StatusTransitionEvent,
} from '@lib/anatomy/types';

import type {
  Avoir,
  AvoirCreate,
  AvoirLigne,
} from '@applications/erp/ventes/models';
import { AvoirPrintComponent } from '@applications/erp/ventes/components';

import { AvoirFacade } from '../services';
import { buildAvoirDetailConfig } from '../config';

@Component({
  selector: 'app-avoir-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    CommonModule,
    MadCurrencyPipe,
    FieldTemplateDirective,
    AvoirPrintComponent,
    TranslateModule,
  ],
  templateUrl: './avoir-detail.page.html',
  styleUrls: ['./avoir-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class AvoirDetailPage extends ConfigDrivenDetailPage<Avoir> {
  private readonly crud = inject(AvoirFacade);
  private readonly nav = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<Avoir, AvoirCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildAvoirDetailConfig(this.translate);

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.mode() === 'create') {
      const factureId =
        this.activatedRoute.snapshot.queryParamMap.get('factureId');
      if (factureId) {
        void this.prefillFromFacture(factureId);
      }
    }
  }

  private async prefillFromFacture(factureId: string): Promise<void> {
    await this.crud.ensureLookups();
    const facture = (this.lookups()['factures'] ?? []).find(
      (f) => f.key === factureId,
    );
    if (!facture) return;
    const data = facture.data as
      | { clientId?: string; numero?: string; clientName?: string }
      | undefined;
    this.item.set({
      id: '',
      numero: '',
      factureOriginaleId: factureId,
      factureOriginaleNumero: data?.numero,
      clientId: data?.clientId ?? '',
      clientName: data?.clientName,
      dateEmission: new Date().toISOString().slice(0, 10),
      motif: '',
      totalHt: 0,
      tvaTaux: 20,
      totalTva: 0,
      totalTtc: 0,
      status: 'BROUILLON',
      lignes: [],
    });
  }

  get headerTitle(): string {
    if (this.mode() === 'create')
      return this.translate.instant('ventes.avoir.createTitle');
    const item = this.item();
    return item
      ? `${item.numero} — ${item.clientName ?? ''}`
      : this.translate.instant('ventes.avoir.detailTitle');
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  lignesValue(item: Avoir | null): AvoirLigne[] {
    return (item?.lignes ?? []) as AvoirLigne[];
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Avoir>,
  ): Promise<void> {
    if (event.actionId === 'print_avoir' && event.item) {
      window.print();
      return;
    }
    await super.handleCustomAction(event);
  }

  override async handleTransition(
    event: StatusTransitionEvent,
  ): Promise<void> {
    const id = this.itemId();
    if (!id) return;
    let updated: Avoir | null = null;
    switch (event.action) {
      case 'emit':
        updated = await this.crud.emit(String(id));
        break;
      case 'imputer':
        updated = await this.crud.imputer(String(id));
        break;
      case 'rembourser':
        updated = await this.crud.rembourser(String(id));
        break;
      case 'cancel':
        updated = await this.crud.cancel(String(id));
        break;
      default:
        await super.handleTransition(event);
        return;
    }
    if (updated) this.item.set(updated);
  }
}
