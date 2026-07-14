import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  LookupItem,
  StatusTransitionEvent,
} from '@lib/anatomy/types';

import type {
  Avoir,
  AvoirCreate,
  AvoirLigne,
} from '@applications/erp/ventes/models';
import { AvoirPrintComponent } from '@applications/erp/ventes/components';
import { DocScanButtonComponent } from '@applications/erp/shared/components/doc-scan-button/doc-scan-button.component';
import {
  extractLines,
  findStringByAliases,
  normalizeDate,
  normalizeText,
  toNumber,
} from '@applications/erp/shared/utils/extraction-json.utils';

import { AvoirFacade } from '../services';
import { buildAvoirDetailConfig } from '../config';
import { PrintService } from '@applications/erp/shared/services';

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
    DocScanButtonComponent,
  ],
  templateUrl: './avoir-detail.page.html',
  styleUrls: ['./avoir-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class AvoirDetailPage extends ConfigDrivenDetailPage<Avoir> {
  private readonly crud = inject(AvoirFacade);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly printService = inject(PrintService);

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

  onScanError(message: string): void {
    this.showError(message);
  }

  onScanAvoir(data: Record<string, unknown>): void {
    const current = this.item() ?? this.emptyDraft();
    let next: Avoir = { ...current };
    let factureResolved = false;

    const date = normalizeDate(
      findStringByAliases(data, ['date', 'dateEmission', 'documentDate', 'creditNoteDate']),
    );
    if (date) {
      next = { ...next, dateEmission: date };
    }

    const motif = findStringByAliases(data, ['motif', 'reason', 'motifAvoir', 'commentaire']);
    if (motif) {
      next = { ...next, motif };
    }

    const invoiceNumber = findStringByAliases(data, [
      'originalInvoiceNumber', 'factureOriginaleNumero', 'invoiceNumber', 'factureNumero',
    ]);
    if (invoiceNumber) {
      const matched = this.matchFacture(invoiceNumber);
      if (matched) {
        factureResolved = true;
        const factureData = matched.data as
          | { clientId?: string; clientName?: string; numero?: string }
          | undefined;
        next = {
          ...next,
          factureOriginaleId: String(matched.key),
          factureOriginaleNumero: factureData?.numero ?? invoiceNumber,
          clientId: factureData?.clientId ?? next.clientId,
          clientName: factureData?.clientName ?? next.clientName,
        };
      }
    }

    if (!next.clientId) {
      const buyerObj = (data['buyer'] && typeof data['buyer'] === 'object')
        ? (data['buyer'] as Record<string, unknown>)
        : null;
      const clientName =
        (buyerObj?.['name'] ? String(buyerObj['name']).trim() : undefined) ??
        findStringByAliases(data, ['clientName', 'buyerName', 'customerName', 'client']);
      if (clientName) {
        const matched = this.matchLookup('clients', clientName);
        if (matched) {
          next = {
            ...next,
            clientId: String(matched.key),
            clientName: matched.value,
          };
        }
      }
    }

    const rawLines = extractLines(data, ['lineItems', 'lignes', 'lines', 'items', 'details']);
    if (rawLines.length > 0) {
      const lignes: AvoirLigne[] = rawLines
        .map((line) => this.mapLine(line, next.id))
        .filter((l) => l.designation.trim().length > 0);
      if (lignes.length > 0) {
        const totalHt = Math.round(
          lignes.reduce((sum, l) => sum + (l.totalHt || 0), 0) * 100,
        ) / 100;
        const tvaTaux = next.tvaTaux || 20;
        const totalTva = Math.round(totalHt * tvaTaux) / 100;
        next = {
          ...next,
          lignes,
          totalHt,
          totalTva,
          totalTtc: Math.round((totalHt + totalTva) * 100) / 100,
        };
      }
    } else {
      const totals = (data['totals'] && typeof data['totals'] === 'object')
        ? (data['totals'] as Record<string, unknown>)
        : null;
      const subtotal = toNumber(totals?.['subtotal'] ?? data['totalHt']);
      if (subtotal > 0) {
        const tvaTaux = next.tvaTaux || 20;
        const totalTva = Math.round(subtotal * tvaTaux) / 100;
        next = {
          ...next,
          totalHt: subtotal,
          totalTva,
          totalTtc: Math.round((subtotal + totalTva) * 100) / 100,
          lignes: [{
            id: '',
            avoirId: next.id,
            designation: motif || 'Avoir',
            totalHt: subtotal,
          }],
        };
      }
    }

    this.item.set(next);
    this.showSuccess(this.translate.instant('ventes.avoir.scan.success'));
    if (invoiceNumber && !factureResolved) {
      this.showError(this.translate.instant('ventes.avoir.scan.factureNotFound', {
        numero: invoiceNumber,
      }));
    }
  }

  private emptyDraft(): Avoir {
    return {
      id: '',
      numero: '',
      factureOriginaleId: '',
      clientId: '',
      dateEmission: new Date().toISOString().slice(0, 10),
      motif: '',
      totalHt: 0,
      tvaTaux: 20,
      totalTva: 0,
      totalTtc: 0,
      status: 'BROUILLON',
      lignes: [],
    };
  }

  private matchFacture(numero: string): LookupItem | undefined {
    const normalized = normalizeText(numero);
    const list = this.lookups()['factures'] ?? [];
    return list.find((f) => {
      const data = f.data as { numero?: string } | undefined;
      return normalizeText(data?.numero ?? f.value).includes(normalized)
        || normalized.includes(normalizeText(data?.numero ?? ''));
    });
  }

  private matchLookup(key: string, name: string): LookupItem | undefined {
    const normalized = normalizeText(name);
    const list = this.lookups()[key] ?? [];
    return list.find((p) => normalizeText(p.value).includes(normalized))
      ?? list.find((p) => normalized.includes(normalizeText(p.value)));
  }

  private mapLine(line: Record<string, unknown>, avoirId: string): AvoirLigne {
    const designation = findStringByAliases(line, [
      'designation', 'description', 'label', 'name',
    ]) ?? '';
    const totalHt = toNumber(line['lineTotal'] ?? line['totalHt'] ?? line['total'] ?? line['montant']);
    return {
      id: '',
      avoirId,
      designation,
      totalHt: totalHt || 0,
    };
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Avoir>,
  ): Promise<void> {
    if (event.actionId === 'print_avoir' && event.item) {
      this.printService.printAvoir();
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
