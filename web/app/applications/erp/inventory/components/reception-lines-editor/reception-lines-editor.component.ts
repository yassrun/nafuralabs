import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { ButtonComponent, NfInputComponent, NfSelectComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { Article, InventoryTxLine } from '../../models';
import { ArticleCatalogService } from '../../services/article-catalog.service';

@Component({
  selector: 'app-reception-lines-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, MadCurrencyPipe, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="rle" [class.rle--readonly]="linesControl().disabled">
      <div class="rle__toolbar">
        <nf-button variant="secondary" icon="plus" iconLibrary="lucide" [disabled]="linesControl().disabled" (clicked)="addLine()">
          {{ 'inventory.components.linesEditor.addLine' | translate }}
        </nf-button>
      </div>

      <div class="rle__table-wrap">
        <table class="rle__table">
          <thead>
            <tr>
              <th>{{ 'inventory.components.linesEditor.columns.article' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.designation' | translate }}</th>
              <th class="rle__num">{{ 'inventory.components.linesEditor.columns.qtyReceived' | translate }}</th>
              <th class="rle__num">{{ 'inventory.components.linesEditor.columns.unitPrice' | translate }}</th>
              <th class="rle__num">{{ 'inventory.components.linesEditor.columns.total' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.uom' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.notes' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (lines().length === 0) {
              <tr>
                <td colspan="8" class="rle__empty">{{ 'inventory.components.linesEditor.reception.emptyMessage' | translate }}</td>
              </tr>
            }
            @for (line of lines(); track line.id; let i = $index) {
              <tr>
                <td>
                  <nf-select
                    class="rle__field"
                    [options]="articleSelectOptions()"
                    [ngModel]="line.articleId"
                    (ngModelChange)="onArticleChange(i, $event)"
                    [disabled]="linesControl().disabled"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="rle__muted">{{ line.articleName || ('inventory.common.dash' | translate) }}</td>
                <td>
                  <nf-input
                    class="rle__field rle__field--num"
                    type="number"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.quantity"
                    (ngModelChange)="patchLine(i, { quantity: +$event })"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td>
                  <nf-input
                    class="rle__field rle__field--num"
                    type="number"
                    placeholder="0.00"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.unitPrice"
                    (ngModelChange)="patchLine(i, { unitPrice: +$event })"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="rle__num rle__total">
                  {{ lineTotal(line) | number: '1.2-2' }}
                </td>
                <td class="rle__muted">{{ line.uomCode || ('inventory.common.dash' | translate) }}</td>
                <td>
                  <nf-input
                    class="rle__field"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.notes"
                    (ngModelChange)="patchLine(i, { notes: $event })"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td>
                  <nf-button variant="ghost" icon="trash-2" iconLibrary="lucide"
                    [disabled]="linesControl().disabled"
                    (clicked)="removeLine(i)"
                    [attr.aria-label]="'inventory.components.linesEditor.removeAria' | translate"></nf-button>
                </td>
              </tr>
            }
          </tbody>
          @if (lines().length > 0) {
            <tfoot>
              <tr class="rle__footer-row">
                <td colspan="4" class="rle__footer-label">{{ 'inventory.components.linesEditor.total.reception' | translate }}</td>
                <td class="rle__num rle__total rle__total--grand">
                  {{ grandTotal() | mad }}
                </td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
    </div>
  `,
  styles: `
    .rle { width: 100%; }
    .rle__toolbar { margin-bottom: 12px; }
    .rle__table-wrap {
      overflow: auto;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
    }
    .rle__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .rle__table th {
      text-align: left;
      padding: 10px 12px;
      background: var(--nf-surface-subtle);
      font-weight: 600;
      border-bottom: 1px solid var(--nf-border-default);
      white-space: nowrap;
    }
    .rle__table td {
      padding: 8px 12px;
      vertical-align: middle;
      border-bottom: 1px solid var(--nf-border-muted);
    }
    .rle__num { text-align: right; }
    .rle__field { width: 100%; min-width: 130px; }
    .rle__field--num { max-width: 110px; }
    .rle__muted { color: var(--nf-text-secondary, var(--nf-text-muted)); }
    .rle__total { font-weight: 500; }
    .rle__footer-row { background: var(--nf-surface-subtle); }
    .rle__footer-label { font-weight: 600; padding: 10px 12px; }
    .rle__total--grand { font-size: 1rem; font-weight: 700; color: var(--nf-color-primary); }
    .rle__empty { text-align: center; color: var(--nf-text-muted); padding: 24px; font-style: italic; }
    .rle--readonly .rle__toolbar { display: none; }
  `,
})
export class ReceptionLinesEditorComponent implements OnDestroy {
  private readonly articleCatalog = inject(ArticleCatalogService);

  readonly linesControl = input.required<FormControl<InventoryTxLine[] | null>>();

  readonly articles = signal<Article[]>([]);
  readonly lines = signal<InventoryTxLine[]>([]);
  readonly articleSelectOptions = computed(() =>
    this.articles().map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
  );

  private readonly destroy$ = new Subject<void>();
  private linesSubSetup = false;

  constructor() {
    effect(() => {
      const c = this.linesControl();
      if (this.linesSubSetup) return;
      this.linesSubSetup = true;
      this.lines.set((c.value as InventoryTxLine[] | null) ?? []);
      c.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
        this.lines.set((v as InventoryTxLine[] | null) ?? []);
      });
    });

    effect(() => {
      void this.loadArticles();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadArticles(): Promise<void> {
    const list = await this.articleCatalog.loadArticles({ activeOnly: true });
    this.articles.set(list);
  }

  lineTotal(line: InventoryTxLine): number {
    return line.totalPrice ?? (line.unitPrice != null ? line.quantity * line.unitPrice : 0);
  }

  grandTotal(): number {
    return this.lines().reduce((sum, l) => sum + this.lineTotal(l), 0);
  }

  addLine(): void {
    const next = [
      ...this.lines(),
      {
        id: crypto.randomUUID(),
        txId: '',
        lineNumber: this.lines().length + 1,
        articleId: '',
        articleCode: '',
        articleName: '',
        quantity: 1,
        uomId: '',
        uomCode: '',
        unitPrice: undefined,
        totalPrice: undefined,
        notes: '',
      } as InventoryTxLine,
    ];
    this.commit(next);
  }

  removeLine(index: number): void {
    const next = this.lines()
      .filter((_, i) => i !== index)
      .map((l, i) => ({ ...l, lineNumber: i + 1 }));
    this.commit(next);
  }

  onArticleChange(index: number, articleId: string): void {
    const art = this.articles().find((a) => a.id === articleId);
    if (!art) {
      this.patchLine(index, { articleId });
      return;
    }
    const unitPrice = art.prixUnitaire ?? 0;
    const qty = this.lines()[index]?.quantity ?? 1;
    this.patchLine(index, {
      articleId,
      articleCode: art.code,
      articleName: art.name,
      uomId: art.uomId,
      uomCode: art.uomCode,
      unitPrice,
      totalPrice: Math.round(qty * unitPrice * 100) / 100,
    });
  }

  patchLine(index: number, patch: Partial<InventoryTxLine>): void {
    const next = this.lines().map((l, i) => (i === index ? this.mergeLine(l, patch) : l));
    this.commit(next);
  }

  private mergeLine(line: InventoryTxLine, patch: Partial<InventoryTxLine>): InventoryTxLine {
    const merged = { ...line, ...patch };
    if (patch.quantity != null || patch.unitPrice != null) {
      const u = merged.unitPrice ?? 0;
      const q = merged.quantity ?? 0;
      merged.totalPrice = Math.round(q * u * 100) / 100;
    }
    return merged;
  }

  private commit(lines: InventoryTxLine[]): void {
    const ctrl = this.linesControl();
    ctrl.setValue(lines);
    ctrl.markAsDirty();
    ctrl.markAsTouched();
    this.lines.set(lines);
  }
}
