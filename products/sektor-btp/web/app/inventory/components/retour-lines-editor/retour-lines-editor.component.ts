import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { ButtonComponent, NfInputComponent, NfSelectComponent } from '@lib/anatomy';
import type { Article, InventoryTxLine } from '../../models';
import { ArticleCatalogService } from '../../services/article-catalog.service';

export type EtatArticle = 'BON' | 'ABIME' | 'INUTILISABLE';

export interface RetourLine extends InventoryTxLine {
  etatArticle?: EtatArticle;
}

const ETAT_OPTIONS: { value: EtatArticle; labelKey: string }[] = [
  { value: 'BON', labelKey: 'inventory.enums.etatArticle.BON' },
  { value: 'ABIME', labelKey: 'inventory.enums.etatArticle.ABIME' },
  { value: 'INUTILISABLE', labelKey: 'inventory.enums.etatArticle.INUTILISABLE' },
];

@Component({
  selector: 'app-retour-lines-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, ButtonComponent, NfInputComponent, NfSelectComponent],
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
              <th class="rle__num">{{ 'inventory.components.linesEditor.columns.qtyReturn' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.uom' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.etatArticle' | translate }}</th>
              <th>{{ 'inventory.components.linesEditor.columns.notes' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines(); track line.id; let i = $index) {
              <tr [class.rle__row--warn]="line.etatArticle === 'ABIME'" [class.rle__row--danger]="line.etatArticle === 'INUTILISABLE'">
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
                    class="rle__field rle__field--qty"
                    type="number"
                    [disabled]="linesControl().disabled"
                    [ngModel]="line.quantity"
                    (ngModelChange)="patchLine(i, { quantity: $event })"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
                <td class="rle__muted">{{ line.uomCode || ('inventory.common.dash' | translate) }}</td>
                <td>
                  <nf-select
                    class="rle__field rle__field--etat"
                    [options]="etatOptions()"
                    [ngModel]="line.etatArticle || 'BON'"
                    (ngModelChange)="patchLine(i, { etatArticle: $event })"
                    [disabled]="linesControl().disabled"
                    [ngModelOptions]="{ standalone: true }" />
                </td>
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
        </table>
      </div>
    </div>
  `,
  styles: `
    .rle {
      width: 100%;
    }
    .rle__toolbar {
      margin-bottom: 12px;
    }
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
    .rle__num {
      text-align: right;
    }
    .rle__field {
      width: 100%;
      min-width: 140px;
    }
    .rle__field--qty {
      max-width: 120px;
    }
    .rle__field--etat {
      min-width: 140px;
      max-width: 160px;
    }
    .rle__muted {
      color: var(--nf-text-secondary, var(--nf-text-muted));
    }
    .rle__row--warn {
      background: color-mix(in srgb, var(--nf-warning, var(--nf-color-warning-500)) 8%, transparent);
    }
    .rle__row--danger {
      background: color-mix(in srgb, var(--nf-danger) 8%, transparent);
    }
    .rle--readonly .rle__toolbar {
      display: none;
    }
  `,
})
export class RetourLinesEditorComponent implements OnDestroy {
  private readonly articleCatalog = inject(ArticleCatalogService);
  private readonly translate = inject(TranslateService);

  readonly linesControl = input.required<FormControl<RetourLine[] | null>>();

  readonly articles = signal<Article[]>([]);
  readonly lines = signal<RetourLine[]>([]);
  readonly articleSelectOptions = computed(() =>
    this.articles().map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
  );
  readonly etatOptions = computed(() =>
    ETAT_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.translate.instant(opt.labelKey),
    })),
  );

  private readonly destroy$ = new Subject<void>();
  private linesSubSetup = false;

  constructor() {
    effect(() => {
      const c = this.linesControl();
      if (this.linesSubSetup) {
        return;
      }
      this.linesSubSetup = true;
      this.lines.set((c.value as RetourLine[] | null) ?? []);
      c.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
        this.lines.set((v as RetourLine[] | null) ?? []);
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

  addLine(): void {
    const next: RetourLine[] = [
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
        etatArticle: 'BON',
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
    this.patchLine(index, {
      articleId,
      articleCode: art.code,
      articleName: art.name,
      uomId: art.uomId,
      uomCode: art.uomCode,
    });
  }

  patchLine(index: number, patch: Partial<RetourLine>): void {
    const next = this.lines().map((l, i) => (i === index ? { ...l, ...patch } : l));
    this.commit(next);
  }

  private commit(lines: RetourLine[]): void {
    const ctrl = this.linesControl();
    ctrl.setValue(lines);
    ctrl.markAsDirty();
    ctrl.markAsTouched();
    this.lines.set(lines);
  }
}
