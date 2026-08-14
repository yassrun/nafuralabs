
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@platform/lib/anatomy';
import { FieldTemplateDirective } from '@platform/lib/anatomy/components/organisms/entity-detail';
import type { LookupItem, StatusTransitionEvent } from '@platform/lib/anatomy/types';
import type {
  BonCommandeClient,
  BCClientCreate,
  BCClientLigne,
  BCClientStatus,
} from '@app/ventes/models';
import { DocScanButtonComponent } from '@app/socle/shared/components/doc-scan-button/doc-scan-button.component';
import {
  extractLines,
  findStringByAliases,
  normalizeDate,
  normalizeText,
  toNumber,
} from '@app/socle/shared/utils/extraction-json.utils';

import { BccFacade } from '../services';
import { BCC_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-bcc-detail',
  standalone: true,
  imports: [
    MadCurrencyPipe,
    FieldTemplateDirective,
    TranslateModule,
    DocScanButtonComponent,
    ...ConfigDrivenDetailPageImports
],
  templateUrl: './bcc-detail.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    ConfigDrivenDetailPageStyles,
    `
      .lignes-table { width: 100%; }
      .lignes-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .lignes-table th, .lignes-table td {
        text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--nf-color-border);
      }
      .lignes-table .num { text-align: right; font-variant-numeric: tabular-nums; }
      .lignes-empty { color: var(--nf-color-text-secondary); font-size: 13px; margin: 0; }
    `,
  ],
})
export class BccDetailPage extends ConfigDrivenDetailPage<BonCommandeClient> {
  private readonly crud = inject(BccFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<BonCommandeClient, BCClientCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = BCC_DETAIL_CONFIG;

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouveau bon de commande client';
    const item = this.item();
    return item ? `${item.numero} — ${item.clientName ?? ''}` : 'Détail BCC';
  }

  lignesValue(item: BonCommandeClient | null): BCClientLigne[] {
    return item?.lignes ?? [];
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;
    const updated = await this.crud.changeStatus(
      String(id),
      event.action as BCClientStatus,
    );
    if (updated) this.item.set(updated);
  }

  onScanError(message: string): void {
    this.showError(message);
  }

  onScanBcc(data: Record<string, unknown>): void {
    const current = this.item() ?? this.emptyDraft();
    let next: BonCommandeClient = { ...current };

    const ref = findStringByAliases(data, [
      'orderReference', 'numeroClient', 'numero', 'reference', 'commandeNumber',
    ]);
    if (ref) {
      next = { ...next, numeroClient: ref };
    }

    const dateRaw = findStringByAliases(data, [
      'date', 'dateReception', 'orderDate', 'documentDate',
    ]);
    const date = normalizeDate(dateRaw);
    if (date) {
      next = { ...next, dateReception: date };
    }

    const clientObj = (data['client'] && typeof data['client'] === 'object')
      ? (data['client'] as Record<string, unknown>)
      : null;
    const clientName =
      (clientObj?.['name'] ? String(clientObj['name']).trim() : undefined) ??
      findStringByAliases(data, ['clientName', 'client', 'buyerName', 'customerName']);
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

    const rawLines = extractLines(data, ['items', 'lignes', 'lines', 'lineItems', 'details']);
    if (rawLines.length > 0) {
      const lignes: BCClientLigne[] = rawLines
        .map((line, index) => this.mapLine(line, next.id, index))
        .filter((l) => l.designation.trim().length > 0);
      if (lignes.length > 0) {
        const montantHt = Math.round(
          lignes.reduce((sum, l) => sum + (l.totalHt || 0), 0) * 100,
        ) / 100;
        next = { ...next, lignes, montantHt };
      }
    }

    this.item.set(next);
    this.showSuccess(this.translate.instant('ventes.bcc.scan.success'));
  }

  private emptyDraft(): BonCommandeClient {
    return {
      id: '',
      numero: '',
      numeroClient: '',
      clientId: '',
      dateReception: new Date().toISOString().slice(0, 10),
      montantHt: 0,
      tvaTaux: 20,
      montantTtc: 0,
      montantFactureHt: 0,
      status: 'RECU',
      lignes: [],
    };
  }

  private matchLookup(key: string, name: string): LookupItem | undefined {
    const normalized = normalizeText(name);
    const list = this.lookups()[key] ?? [];
    return list.find((p) => normalizeText(p.value).includes(normalized))
      ?? list.find((p) => normalized.includes(normalizeText(p.value)));
  }

  private mapLine(
    line: Record<string, unknown>,
    bccId: string,
    index: number,
  ): BCClientLigne {
    const designation = findStringByAliases(line, [
      'designation', 'description', 'label', 'name', 'articleName',
    ]) ?? '';
    const quantite = toNumber(line['quantity'] ?? line['quantite'] ?? line['qty']);
    const prixUnitaireHt = toNumber(
      line['unitPrice'] ?? line['prixUnitaire'] ?? line['prixUnitaireHt'] ?? line['pu'],
    );
    const lineTotal = toNumber(line['lineTotal'] ?? line['totalHt'] ?? line['total']);
    const totalHt = lineTotal
      ?? Math.round((quantite || 0) * (prixUnitaireHt || 0) * 100) / 100;
    const unite = findStringByAliases(line, ['uom', 'unite', 'unit']) ?? undefined;

    return {
      id: '',
      bccId,
      ordre: index + 1,
      designation,
      unite,
      quantite: quantite || undefined,
      prixUnitaireHt: prixUnitaireHt || undefined,
      totalHt: totalHt || 0,
    };
  }
}
