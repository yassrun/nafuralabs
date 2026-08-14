import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, startWith, takeUntil } from 'rxjs';

import { ButtonComponent, NfInputComponent, NfSelectComponent } from '@lib/anatomy';
import type { Article, InventoryTxLine } from '../../models';
import { ArticleCatalogService } from '../../services/article-catalog.service';
import { StockQueryService } from '../../services/stock-query.service';
import { StockQtyCellComponent } from '../stock-qty-cell/stock-qty-cell.component';

@Component({
  selector: 'app-transfert-lines-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StockQtyCellComponent, TranslateModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="trl" [class.trl--readonly]="linesControl().disabled">
      <div class="trl__toolbar">
        <nf-button variant="secondary" icon="plus" iconLibrary="lucide" [disabled]="linesControl().disabled" (clicked)="addLine()">
          {{ 'inventory.components.linesEditor.addLine' | translate }}
        </nf-button>
      </div>

      <div class="trl__table-wrap">
        <table class="trl__table">
          <thead>
            <tr>
              <th>{{ 'inventory.components.linesEditor.columns.article' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.designation' | translate }}</th>
              <th class="trl__num">{{ 'inventory.components.linesEditor.columns.qty' | translate }}</th>
              <th class="trl__num">{{ 'inventory.components.linesEditor.transfert.sourceStockLabel' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.uom' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.notes' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines(); track line.id; let i = $index) {
              <tr [class.trl__row--warn]="isShort(line)">
                <td>
                  <nf-select
                    class="trl__field"
                    [options]="articleSelectOptions()"
                    [ngModel]="line.articleId"
                    (ngModelChange)="onArticleChange(i, $event)"
                    [disabled]="linesControl().disabled"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="trl__muted">{{ line.articleName || ('inventory.common.dash' | translate) }}</td>
                <td>
                  <nf-input
                    class="trl__field trl__field--qty"
                    type="number"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.quantity"
                    (ngModelChange)="patchLine(i, { quantity: $event })"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="trl__num">
                  <app-stock-qty-cell
                    [requested]="line.quantity"
                    [available]="availableFor(line.articleId)" />
                </td>
                <td class="trl__muted">{{ line.uomCode || ('inventory.common.dash' | translate) }}</td>
                <td>
                  <nf-input
                    class="trl__field"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.notes"
                    (ngModelChange)="patchLine(i, { notes: $event })"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td>
                  <nf-button variant="ghost" icon="trash-2" iconLibrary="lucide"
                    [disabled]="linesControl().disabled"
                    (clicked)="removeLine(i)"
                    [attr.aria-label]="'inventory.components.linesEditor.removeAria' | translate" ></nf-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .trl {
      width: 100%;
    }
    .trl__toolbar {
      margin-bottom: 12px;
    }
    .trl__table-wrap {
      overflow: auto;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
    }
    .trl__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .trl__table th {
      text-align: left;
      padding: 10px 12px;
      background: var(--nf-surface-subtle);
      font-weight: 600;
      border-bottom: 1px solid var(--nf-border-default);
      white-space: nowrap;
    }
    .trl__table td {
      padding: 8px 12px;
      vertical-align: middle;
      border-bottom: 1px solid var(--nf-border-muted);
    }
    .trl__num {
      text-align: right;
    }
    .trl__field {
      width: 100%;
      min-width: 140px;
    }
    .trl__field--qty {
      max-width: 120px;
    }
    .trl__muted {
      color: var(--nf-text-secondary, var(--nf-text-muted));
    }
    .trl__row--warn {
      background: color-mix(in srgb, var(--nf-warning, var(--nf-color-warning-500)) 8%, transparent);
    }
    .trl--readonly .trl__toolbar {
      display: none;
    }
  `,
})
export class TransfertLinesEditorComponent implements OnDestroy {
  private readonly stockQuery = inject(StockQueryService);
  private readonly articleCatalog = inject(ArticleCatalogService);

  readonly linesControl = input.required<FormControl<InventoryTxLine[] | null>>();

  readonly headerForm = input<FormGroup | null>(null);

  readonly articles = signal<Article[]>([]);
  readonly lines = signal<InventoryTxLine[]>([]);
  readonly articleSelectOptions = computed(() =>
    this.articles().map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
  );

  private readonly destroy$ = new Subject<void>();
  private linesSubSetup = false;
  private headerSubSetup = false;

  constructor() {
    effect(() => {
      const c = this.linesControl();
      if (this.linesSubSetup) {
        return;
      }
      this.linesSubSetup = true;
      this.lines.set((c.value as InventoryTxLine[] | null) ?? []);
      c.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
        this.lines.set((v as InventoryTxLine[] | null) ?? []);
      });
    });

    effect(() => {
      const h = this.headerForm();
      if (!h || this.headerSubSetup) {
        return;
      }
      this.headerSubSetup = true;
      const ctrl = h.get('sourceLocationId');
      ctrl
        ?.valueChanges.pipe(takeUntil(this.destroy$), startWith(ctrl.value))
        .subscribe((sourceId) => {
          this.lines.set([...(this.lines())]);
          if (typeof sourceId === 'string' && sourceId.length > 0) {
            void this.stockQuery.loadAllBalances();
          }
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

  sourceLocationId(): string | null {
    const raw = this.headerForm()?.get('sourceLocationId')?.value;
    return typeof raw === 'string' ? raw : null;
  }

  availableFor(articleId: string): number {
    const sourceId = this.sourceLocationId();
    if (!sourceId || !articleId) {
      return 0;
    }
    return this.stockQuery.getAvailableQuantity(articleId, sourceId);
  }

  isShort(line: InventoryTxLine): boolean {
    if (!line.articleId) {
      return false;
    }
    return line.quantity > this.availableFor(line.articleId);
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
        quantity: 0,
        uomId: '',
        uomCode: '',
        unitPrice: undefined,
        totalPrice: undefined,
        notes: '',
      },
    ];
    this.commit(next);
  }

  removeLine(index: number): void {
    const next = this.lines().filter((_, i) => i !== index);
    this.commit(next.map((l, i) => ({ ...l, lineNumber: i + 1 })));
  }

  onArticleChange(index: number, articleId: string): void {
    const art = this.articles().find((a) => a.id === articleId);
    if (!art) {
      this.patchLine(index, { articleId });
      return;
    }
    const unitPrice = art.prixUnitaire ?? 0;
    const line = this.lines()[index];
    const qty = line?.quantity ?? 0;
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
