import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { DetailActionEvent } from '@lib/anatomy/types';
import type { FichePaie, FichePaieCreate } from '@applications/erp/rh/models';

import { PaieFacade } from '../services';
import { buildPaieDetailConfig } from '../config';
import { ButtonComponent } from '@lib/anatomy/components/atoms/button/button.component';
import { ExportService } from '@lib/anatomy/services/export.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';

@Component({
  selector: 'app-paie-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, MadCurrencyPipe, ButtonComponent, SubmitApprovalButtonComponent, ...ConfigDrivenDetailPageImports],
  templateUrl: './paie-detail.page.html',
  styles: [
    ConfigDrivenDetailPageStyles,
    `
    .paie-recap { margin: 0 1rem 1rem; padding: 1rem 1.25rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 10px; max-width: 960px; }
    .paie-recap__title { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .paie-recap__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px 14px; margin: 0; }
    .paie-recap__grid div { margin: 0; }
    .paie-recap__grid dt { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--nf-color-text-secondary); font-weight: 600; margin: 0 0 2px; }
    .paie-recap__grid dd { margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--nf-color-text-primary); font-variant-numeric: tabular-nums; }
    .paie-recap__net dd { color: var(--nf-color-primary-700); font-size: 1.05rem; }
    .paie-recap__hint { margin: 0.75rem 0 0; font-size: 11px; color: var(--nf-color-text-muted); }
    .paie-approval {
      margin: 0 1rem 0.75rem;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      background: var(--nf-color-bg-subtle);
      border: 1px solid var(--nf-color-border);
      border-radius: 8px;
      max-width: 960px;
    }
    .paie-approval__label { font-size: 12px; font-weight: 600; color: var(--nf-color-text-secondary); }
    `,
    `
    .paie-print-doc { display: none; }
    @media print {
      .paie-screen { display: none !important; }
      .paie-recap { display: none !important; }
      .paie-print-doc {
        display: block !important;
        font-family: system-ui, sans-serif;
        font-size: 10pt;
        color: var(--nf-color-text-primary);
      }
      .paie-print-doc h1 { font-size: 14pt; margin: 0 0 0.5rem; }
      .paie-print-doc table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
      .paie-print-doc th, .paie-print-doc td { border: 1px solid var(--nf-color-border); padding: 4px 6px; text-align: left; }
      .paie-print-doc .n { text-align: right; font-variant-numeric: tabular-nums; }
    }
    `,
  ],
})
export class PaieDetailPage extends ConfigDrivenDetailPage<FichePaie> {
  private readonly translate = inject(TranslateService);
  private readonly crud = inject(PaieFacade);
  private readonly exportService = inject(ExportService);
  private readonly audit = inject(ErpAuditService);

  readonly facade = createDetailFacadeFromCrud<FichePaie, FichePaieCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildPaieDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('rh.paie.bulletin.titleNew');
    const item = this.item();
    return item
      ? `${item.numero} — ${item.employeNom ?? ''} (${item.mois})`
      : this.translate.instant('rh.paie.bulletin.titleDetail');
  }

  protected override async handleCustomAction(event: DetailActionEvent<FichePaie>): Promise<void> {
    const item = event.item;

    if (event.actionId === 'valider' && item) {
      const updated = await this.crud.valider(item.id);
      this.item.set(updated);
      this.showSuccess(this.translate.instant('rh.paie.toasts.validated', { numero: updated.numero }));
      return;
    }

    if (event.actionId === 'payer' && item) {
      const updated = await this.crud.payer(item.id);
      this.item.set(updated);
      this.showSuccess(this.translate.instant('rh.paie.toasts.paid', { numero: updated.numero }));
      return;
    }

    await super.handleCustomAction(event);
  }

  printFiche(): void {
    const fp = this.item();
    if (!fp) return;
    this.exportService.printPage();
    this.audit.log('PRINT', 'FICHE_PAIE', fp.id, fp.numero, fp.mois);
  }
}
