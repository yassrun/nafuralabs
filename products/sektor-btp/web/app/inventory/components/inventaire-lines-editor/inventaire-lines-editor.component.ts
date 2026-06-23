import { Component, OnDestroy, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { ButtonComponent, NfInputComponent, NfSelectComponent } from '@lib/anatomy';
import type { Article, InventaireLine, StockBalance } from '../../models';
import { ArticleCatalogService } from '../../services/article-catalog.service';
import { StockQueryService } from '../../services/stock-query.service';

@Component({
  selector: 'app-inventaire-lines-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="inv" [class.inv--readonly]="linesControl().disabled">
      <div class="inv__toolbar">
        <nf-button
          variant="secondary"
          icon="inventory-2"
          iconLibrary="lucide"
          [disabled]="linesControl().disabled || !locationId()"
          (clicked)="prefillFromStock()">
          {{ 'inventory.components.linesEditor.inventaire.loadStockButton' | translate }}
        </nf-button>
        <nf-button
          variant="secondary"
          icon="plus"
          iconLibrary="lucide"
          [disabled]="linesControl().disabled"
          (clicked)="addLine()">
          {{ 'inventory.components.linesEditor.addLine' | translate }}
        </nf-button>
      </div>

      @if (!locationId()) {
        <div class="inv__hint">
          {{ 'inventory.components.linesEditor.inventaire.emptyInitial' | translate }}
        </div>
      }

      <div class="inv__table-wrap">
        <table class="inv__table">
          <thead>
            <tr>
              <th>{{ 'inventory.components.linesEditor.columns.article' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.designation' | translate }}</th>
              <th class="inv__num">{{ 'inventory.components.linesEditor.columns.qtyTheoretical' | translate }}</th>
              <th class="inv__num">{{ 'inventory.components.linesEditor.columns.qtyPhysical' | translate }}</th>
              <th class="inv__num">{{ 'inventory.components.linesEditor.columns.variance' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.uom' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.notes' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines(); track line.id; let i = $index) {
              <tr [class.inv__row--negative]="line.variance < 0" [class.inv__row--positive]="line.variance > 0">
                <td>
                  @if (line.articleId && line.articleCode) {
                    <span class="inv__article-code">{{ line.articleCode }}</span>
                  } @else {
                    <nf-select
                      class="inv__field"
                      [options]="articleSelectOptions()"
                      [ngModel]="line.articleId"
                      (ngModelChange)="onArticleChange(i, $event)"
                      [disabled]="linesControl().disabled"
                      [ngModelOptions]="{ standalone: true }" />
                  }
                </td>
                <td class="inv__muted">{{ line.articleName || ('inventory.common.dash' | translate) }}</td>
                <td class="inv__num inv__theoretical">{{ line.theoreticalQty }}</td>
                <td>
                  <nf-input
                    class="inv__field inv__field--qty"
                    type="number"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.countedQty"
                    (ngModelChange)="patchLine(i, { countedQty: $event })"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="inv__num inv__variance" [class.inv__variance--negative]="line.variance < 0" [class.inv__variance--positive]="line.variance > 0">
                  {{ formatVariance(line.variance) }}
                </td>
                <td class="inv__muted">{{ line.uomCode || ('inventory.common.dash' | translate) }}</td>
                <td>
                  <nf-input
                    class="inv__field"
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
              <tr class="inv__footer">
                <td colspan="4" class="inv__footer-label">{{ 'inventory.components.linesEditor.total.inventaire' | translate }}</td>
                <td class="inv__num inv__variance" [class.inv__variance--negative]="totalVariance() < 0" [class.inv__variance--positive]="totalVariance() > 0">
                  {{ formatVariance(totalVariance()) }}
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
    .inv {
      width: 100%;
    }
    .inv__toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .inv__hint {
      color: var(--nf-text-secondary, var(--nf-text-muted));
      font-size: 0.875rem;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: var(--nf-surface-subtle);
      border-radius: 6px;
    }
    .inv__table-wrap {
      overflow: auto;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
    }
    .inv__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .inv__table th {
      text-align: left;
      padding: 10px 12px;
      background: var(--nf-surface-subtle);
      font-weight: 600;
      border-bottom: 1px solid var(--nf-border-default);
      white-space: nowrap;
    }
    .inv__table td {
      padding: 8px 12px;
      vertical-align: middle;
      border-bottom: 1px solid var(--nf-border-muted);
    }
    .inv__num {
      text-align: right;
    }
    .inv__field {
      width: 100%;
      min-width: 140px;
    }
    .inv__field--qty {
      max-width: 120px;
    }
    .inv__muted {
      color: var(--nf-text-secondary, var(--nf-text-muted));
    }
    .inv__article-code {
      font-family: monospace;
      font-weight: 500;
    }
    .inv__theoretical {
      color: var(--nf-text-secondary, var(--nf-text-muted));
      font-style: italic;
    }
    .inv__variance {
      font-weight: 600;
    }
    .inv__variance--negative {
      color: var(--nf-danger, var(--nf-color-danger-600));
    }
    .inv__variance--positive {
      color: var(--nf-success, var(--nf-color-success-600));
    }
    .inv__row--negative {
      background: color-mix(in srgb, var(--nf-danger, var(--nf-color-danger-600)) 6%, transparent);
    }
    .inv__row--positive {
      background: color-mix(in srgb, var(--nf-success, var(--nf-color-success-600)) 6%, transparent);
    }
    .inv__footer {
      background: var(--nf-surface-subtle);
      font-weight: 600;
    }
    .inv__footer-label {
      text-align: right;
      padding-right: 24px !important;
    }
    .inv--readonly .inv__toolbar {
      display: none;
    }
  `,
})
export class InventaireLinesEditorComponent implements OnDestroy {
  private readonly stockQuery = inject(StockQueryService);
  private readonly articleCatalog = inject(ArticleCatalogService);

  readonly linesControl = input.required<FormControl<InventaireLine[] | null>>();
  readonly headerForm = input<FormGroup | null>(null);

  readonly prefillRequested = output<void>();

  readonly articles = signal<Article[]>([]);
  readonly lines = signal<InventaireLine[]>([]);
  readonly articleSelectOptions = computed(() =>
    this.articles().map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
  );

  readonly totalVariance = signal<number>(0);

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
      const initial = (c.value as InventaireLine[] | null) ?? [];
      this.lines.set(initial);
      this.updateTotalVariance(initial);
      c.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
        const arr = (v as InventaireLine[] | null) ?? [];
        this.lines.set(arr);
        this.updateTotalVariance(arr);
      });
    });

    effect(() => {
      const h = this.headerForm();
      if (!h || this.headerSubSetup) {
        return;
      }
      this.headerSubSetup = true;
      h.get('destLocationId')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.lines.set([]);
          this.commit([]);
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

  locationId(): string | null {
    const raw = this.headerForm()?.get('destLocationId')?.value;
    return typeof raw === 'string' ? raw : null;
  }

  formatVariance(v: number): string {
    if (v === 0) return '0';
    return v > 0 ? `+${v}` : String(v);
  }

  async prefillFromStock(): Promise<void> {
    const locId = this.locationId();
    if (!locId) return;

    await this.stockQuery.loadAllBalances();
    const balances: StockBalance[] = this.stockQuery.getByWarehouse(locId);
    const artMap = new Map(this.articles().map((a) => [a.id, a]));
    const newLines: InventaireLine[] = balances.map((sb, i) => {
      const art = artMap.get(sb.articleId);
      return {
        id: crypto.randomUUID(),
        txId: '',
        lineNumber: i + 1,
        articleId: sb.articleId,
        articleCode: sb.articleCode ?? art?.code ?? '',
        articleName: sb.articleName ?? art?.name ?? '',
        quantity: sb.quantity,
        theoreticalQty: sb.quantity,
        countedQty: sb.quantity,
        variance: 0,
        uomId: art?.uomId ?? '',
        uomCode: art?.uomCode ?? '',
        notes: '',
      };
    });
    this.commit(newLines);
    this.prefillRequested.emit();
  }

  addLine(): void {
    const next: InventaireLine[] = [
      ...this.lines(),
      {
        id: crypto.randomUUID(),
        txId: '',
        lineNumber: this.lines().length + 1,
        articleId: '',
        articleCode: '',
        articleName: '',
        quantity: 0,
        theoreticalQty: 0,
        countedQty: 0,
        variance: 0,
        uomId: '',
        uomCode: '',
        notes: '',
      },
    ];
    this.commit(next);
  }

  removeLine(index: number): void {
    const next = this.lines().filter((_, i) => i !== index);
    this.commit(next.map((l, i) => ({ ...l, lineNumber: i + 1 })));
  }

  async onArticleChange(index: number, articleId: string): Promise<void> {
    const art = this.articles().find((a) => a.id === articleId);
    if (!art) {
      this.patchLine(index, { articleId });
      return;
    }
    const locId = this.locationId();
    if (locId) {
      await this.stockQuery.loadAllBalances();
    }
    const balances = locId ? this.stockQuery.getByWarehouse(locId) : [];
    const sb = balances.find((b) => b.articleId === articleId);
    const theoreticalQty = sb?.quantity ?? 0;

    this.patchLine(index, {
      articleId,
      articleCode: art.code,
      articleName: art.name,
      uomId: art.uomId,
      uomCode: art.uomCode,
      theoreticalQty,
      countedQty: theoreticalQty,
      variance: 0,
    });
  }

  patchLine(index: number, patch: Partial<InventaireLine>): void {
    const next = this.lines().map((l, i) => (i === index ? this.mergeLine(l, patch) : l));
    this.commit(next);
  }

  private mergeLine(line: InventaireLine, patch: Partial<InventaireLine>): InventaireLine {
    const merged = { ...line, ...patch };
    if (patch.countedQty != null || patch.theoreticalQty != null) {
      merged.variance = merged.countedQty - merged.theoreticalQty;
      merged.quantity = merged.countedQty;
    }
    return merged;
  }

  private updateTotalVariance(lines: InventaireLine[]): void {
    this.totalVariance.set(lines.reduce((acc, l) => acc + (l.variance ?? 0), 0));
  }

  private commit(lines: InventaireLine[]): void {
    const ctrl = this.linesControl();
    ctrl.setValue(lines);
    ctrl.markAsDirty();
    ctrl.markAsTouched();
    this.lines.set(lines);
    this.updateTotalVariance(lines);
  }
}
