import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { ButtonComponent, NfInputComponent, NfSelectComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { Article, InventoryTxLine } from '../../models';
import { ArticleCatalogService } from '../../services/article-catalog.service';

export type CauseDetaillee = 'DECOUPE' | 'CASSE' | 'DETERIORATION' | 'AUTRE';

export interface PerteLine extends InventoryTxLine {
  causeDetaillee?: CauseDetaillee;
}

const CAUSE_OPTIONS: { value: CauseDetaillee; labelKey: string }[] = [
  { value: 'DECOUPE', labelKey: 'inventory.enums.causeDetaillee.DECOUPE' },
  { value: 'CASSE', labelKey: 'inventory.enums.causeDetaillee.CASSE' },
  { value: 'DETERIORATION', labelKey: 'inventory.enums.causeDetaillee.DETERIORATION' },
  { value: 'AUTRE', labelKey: 'inventory.enums.causeDetaillee.AUTRE' },
];

@Component({
  selector: 'app-perte-lines-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, MadCurrencyPipe, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="ple" [class.ple--readonly]="linesControl().disabled">
      <div class="ple__toolbar">
        <nf-button variant="secondary" icon="plus" iconLibrary="lucide" [disabled]="linesControl().disabled" (clicked)="addLine()">
          {{ 'inventory.components.linesEditor.addLine' | translate }}
        </nf-button>
      </div>

      <div class="ple__table-wrap">
        <table class="ple__table">
          <thead>
            <tr>
              <th>{{ 'inventory.components.linesEditor.columns.article' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.designation' | translate }}</th>
              <th class="ple__num">{{ (variant() === 'sortie' ? 'inventory.components.linesEditor.columns.qtySortie' : 'inventory.components.linesEditor.columns.qtyPerdue') | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.uom' | translate }}</th>
              @if (showCauseColumn()) {
                <th>{{ 'inventory.components.linesEditor.columns.causeDetaillee' | translate }}</th>
              }
              <th class="ple__num">{{ 'inventory.components.linesEditor.columns.unitPrice' | translate }}</th>
              <th class="ple__num">{{ (variant() === 'sortie' ? 'inventory.components.linesEditor.columns.totalHT' : 'inventory.components.linesEditor.columns.valeur') | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines(); track line.id; let i = $index) {
              <tr>
                <td>
                  <nf-select
                    class="ple__field"
                    [options]="articleSelectOptions()"
                    [ngModel]="line.articleId"
                    (ngModelChange)="onArticleChange(i, $event)"
                    [disabled]="linesControl().disabled"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="ple__muted">{{ line.articleName || ('inventory.common.dash' | translate) }}</td>
                <td>
                  <nf-input
                    class="ple__field ple__field--qty"
                    type="number"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.quantity"
                    (ngModelChange)="onQtyChange(i, $event)"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="ple__muted">{{ line.uomCode || ('inventory.common.dash' | translate) }}</td>
                @if (showCauseColumn()) {
                  <td>
                    <nf-select
                      class="ple__field ple__field--cause"
                      [options]="causeOptions()"
                      [ngModel]="line.causeDetaillee || 'AUTRE'"
                      (ngModelChange)="patchLine(i, { causeDetaillee: $event, notes: $event })"
                      [disabled]="linesControl().disabled"
                      [ngModelOptions]="{ standalone: true }" />
                  </td>
                }
                <td class="ple__muted ple__num">{{ line.unitPrice != null ? (line.unitPrice | number:'1.2-2') : ('inventory.common.dash' | translate) }}</td>
                <td class="ple__value ple__num">{{ line.totalPrice != null ? (line.totalPrice | number:'1.2-2') : ('inventory.common.dash' | translate) }}</td>
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
              <tr>
                <td [attr.colspan]="showCauseColumn() ? 6 : 5" class="ple__total-label">
                  {{ (variant() === 'sortie' ? 'inventory.components.linesEditor.perte.totalSortieHT' : 'inventory.components.linesEditor.perte.totalValeurPerdue') | translate }}
                </td>
                <td class="ple__total-value ple__num">{{ totalValue() | mad }}</td>
                <td></td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
    </div>
  `,
  styles: `
    .ple {
      width: 100%;
    }
    .ple__toolbar {
      margin-bottom: 12px;
    }
    .ple__table-wrap {
      overflow: auto;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
    }
    .ple__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .ple__table th {
      text-align: left;
      padding: 10px 12px;
      background: var(--nf-surface-subtle);
      font-weight: 600;
      border-bottom: 1px solid var(--nf-border-default);
      white-space: nowrap;
    }
    .ple__table td {
      padding: 8px 12px;
      vertical-align: middle;
      border-bottom: 1px solid var(--nf-border-muted);
    }
    .ple__num {
      text-align: right;
    }
    .ple__field {
      width: 100%;
      min-width: 140px;
    }
    .ple__field--qty {
      max-width: 100px;
    }
    .ple__field--cause {
      min-width: 140px;
      max-width: 160px;
    }
    .ple__muted {
      color: var(--nf-text-secondary, var(--nf-text-muted));
    }
    .ple__value {
      font-weight: 600;
      color: var(--nf-danger);
    }
    .ple__total-label {
      text-align: right;
      font-weight: 600;
      background: var(--nf-surface-subtle);
    }
    .ple__total-value {
      font-weight: 700;
      font-size: 1rem;
      color: var(--nf-danger);
      background: var(--nf-surface-subtle);
    }
    .ple--readonly .ple__toolbar {
      display: none;
    }
  `,
})
export class PerteLinesEditorComponent implements OnDestroy {
  private readonly articleCatalog = inject(ArticleCatalogService);
  private readonly translate = inject(TranslateService);

  readonly linesControl = input.required<FormControl<PerteLine[] | null>>();
  /** `sortie` masque la colonne « cause » (réutilisation pour sorties stock). */
  readonly variant = input<'perte' | 'sortie'>('perte');

  readonly articles = signal<Article[]>([]);
  readonly lines = signal<PerteLine[]>([]);
  readonly articleSelectOptions = computed(() =>
    this.articles().map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
  );
  readonly causeOptions = computed(() =>
    CAUSE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.translate.instant(opt.labelKey),
    })),
  );

  readonly totalValue = signal<number>(0);

  readonly showCauseColumn = computed(() => this.variant() === 'perte');

  private readonly destroy$ = new Subject<void>();
  private linesSubSetup = false;

  constructor() {
    effect(() => {
      const c = this.linesControl();
      if (this.linesSubSetup) {
        return;
      }
      this.linesSubSetup = true;
      this.lines.set((c.value as PerteLine[] | null) ?? []);
      this.computeTotal();
      c.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
        this.lines.set((v as PerteLine[] | null) ?? []);
        this.computeTotal();
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

  private computeTotal(): void {
    const t = this.lines().reduce((acc, l) => acc + (l.totalPrice ?? 0), 0);
    this.totalValue.set(Math.round(t * 100) / 100);
  }

  addLine(): void {
    const next: PerteLine[] = [
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
        causeDetaillee: 'AUTRE',
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
    const line = this.lines()[index];
    const unitPrice = art.pmp ?? art.prixUnitaire;
    const totalPrice = unitPrice != null ? Math.round(line.quantity * unitPrice * 100) / 100 : undefined;
    this.patchLine(index, {
      articleId,
      articleCode: art.code,
      articleName: art.name,
      uomId: art.uomId,
      uomCode: art.uomCode,
      unitPrice,
      totalPrice,
    });
  }

  onQtyChange(index: number, qty: number): void {
    const line = this.lines()[index];
    const totalPrice = line.unitPrice != null ? Math.round(qty * line.unitPrice * 100) / 100 : undefined;
    this.patchLine(index, { quantity: qty, totalPrice });
  }

  patchLine(index: number, patch: Partial<PerteLine>): void {
    const next = this.lines().map((l, i) => (i === index ? { ...l, ...patch } : l));
    this.commit(next);
  }

  private commit(lines: PerteLine[]): void {
    const ctrl = this.linesControl();
    ctrl.setValue(lines);
    ctrl.markAsDirty();
    ctrl.markAsTouched();
    this.lines.set(lines);
    this.computeTotal();
  }
}
