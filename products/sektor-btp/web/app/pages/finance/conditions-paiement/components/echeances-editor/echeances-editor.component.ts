import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import type { EcheancePaiement } from '@applications/erp/finance/models';
import { ButtonComponent } from '@lib/anatomy/components';


@Component({
  selector: 'app-echeances-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ech">
      <div class="ech__header">
        <strong>{{ 'finance.conditionPaiement.echeances.title' | translate }}</strong>
        <span
          class="ech__sum"
          [class.ech__sum--ok]="totalPercent() === 100"
          [class.ech__sum--ko]="totalPercent() !== 100">
          Σ {{ totalPercent() }} %
          @if (totalPercent() !== 100) {
            <small> {{ 'finance.conditionPaiement.echeances.mustBeHundred' | translate }}</small>
          }
        </span>
        @if (!readonly) {
          <nf-button variant="primary" class="ech__btn ech__btn--add" (clicked)="add()">
            {{ 'finance.conditionPaiement.echeances.add' | translate }}
          </nf-button>
        }
      </div>

      <table class="ech__table">
        <thead>
          <tr>
            <th class="ech__col-ord">{{ 'finance.conditionPaiement.echeances.cols.ordre' | translate }}</th>
            <th class="ech__col-pct">%</th>
            <th class="ech__col-del">{{ 'finance.conditionPaiement.echeances.cols.delai' | translate }}</th>
            <th>{{ 'finance.conditionPaiement.echeances.cols.description' | translate }}</th>
            @if (!readonly) {
              <th class="ech__col-act"></th>
            }
          </tr>
        </thead>
        <tbody>
          @for (e of echeances(); track e.id; let i = $index) {
            <tr>
              <td class="ech__col-ord">
                <input
                  type="number"
                  [ngModel]="e.ordre"
                  (ngModelChange)="patch(e.id, { ordre: $event })"
                  min="1"
                  [disabled]="readonly" />
              </td>
              <td class="ech__col-pct">
                <input
                  type="number"
                  [ngModel]="e.pourcentage"
                  (ngModelChange)="patch(e.id, { pourcentage: $event ?? 0 })"
                  min="0"
                  max="100"
                  step="1"
                  [disabled]="readonly" />
              </td>
              <td class="ech__col-del">
                <input
                  type="number"
                  [ngModel]="e.delaiJours"
                  (ngModelChange)="patch(e.id, { delaiJours: $event ?? 0 })"
                  min="0"
                  [disabled]="readonly" />
              </td>
              <td>
                <input
                  type="text"
                  [ngModel]="e.description"
                  (ngModelChange)="patch(e.id, { description: $event ?? '' })"
                  [attr.placeholder]="'finance.conditionPaiement.echeances.descriptionPlaceholder' | translate"
                  [disabled]="readonly" />
              </td>
              @if (!readonly) {
                <td class="ech__col-act">
                  <nf-button variant="danger" class="ech__btn ech__btn--del" (clicked)="remove(e.id)">
                    ×
                  </nf-button>
                </td>
              }
            </tr>
          } @empty {
            <tr class="ech__empty">
              <td [attr.colspan]="readonly ? 4 : 5">
                {{ 'finance.conditionPaiement.echeances.emptyState' | translate }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ech {
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ech__header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .ech__sum {
        font-size: 12px;
        padding: 2px 10px;
        border-radius: 999px;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .ech__sum--ok {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-800);
      }
      .ech__sum--ko {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-800);
      }
      .ech__sum small {
        font-weight: 500;
        color: var(--nf-color-danger-700);
      }
      .ech__btn {
        margin-left: auto;
        background: var(--nf-color-primary-700);
        color: var(--nf-color-surface);
        border: 0;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
      }
      .ech__btn--add:hover {
        background: var(--nf-color-primary-800);
      }
      .ech__btn--del {
        background: transparent;
        color: var(--nf-color-danger-600);
        font-size: 18px;
        font-weight: bold;
        padding: 2px 8px;
      }
      .ech__btn--del:hover {
        background: var(--nf-color-danger-100);
      }
      .ech__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .ech__table th {
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        font-weight: 600;
        padding: 6px 8px;
        background: var(--nf-color-bg-subtle);
        border-bottom: 1px solid var(--nf-color-border);
      }
      .ech__table td {
        padding: 4px 6px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        vertical-align: middle;
      }
      .ech__table input {
        width: 100%;
        border: 1px solid transparent;
        background: transparent;
        padding: 6px 8px;
        font-size: 13px;
        border-radius: 4px;
      }
      .ech__table input:focus {
        outline: 0;
        background: var(--nf-color-surface);
        border-color: var(--nf-color-primary-300);
      }
      .ech__col-ord {
        width: 80px;
      }
      .ech__col-pct {
        width: 100px;
      }
      .ech__col-del {
        width: 110px;
      }
      .ech__col-act {
        width: 40px;
        text-align: center;
      }
      .ech__empty td {
        padding: 18px;
        text-align: center;
        color: var(--nf-color-text-muted);
        font-style: italic;
      }
    `,
  ],
})
export class EcheancesEditorComponent {
  private _list = signal<EcheancePaiement[]>([]);
  private _readonly = false;
  private _conditionId = '';

  readonly echeances = computed(() => this._list());

  readonly totalPercent = computed(() =>
    Math.round(this._list().reduce((s, e) => s + (e.pourcentage || 0), 0)),
  );

  @Input() set echeancesValue(value: EcheancePaiement[] | null | undefined) {
    this._list.set(Array.isArray(value) ? [...value] : []);
  }

  @Input() set readonly(value: boolean) {
    this._readonly = value;
  }
  get readonly(): boolean {
    return this._readonly;
  }

  @Input() set conditionId(value: string) {
    this._conditionId = value;
  }

  @Output() readonly echeancesChange = new EventEmitter<EcheancePaiement[]>();

  add(): void {
    const next: EcheancePaiement = {
      id: crypto.randomUUID(),
      conditionId: this._conditionId,
      ordre: this._list().length + 1,
      pourcentage: 0,
      delaiJours: 0,
      description: '',
    };
    const list = [...this._list(), next];
    this._list.set(list);
    this.echeancesChange.emit(list);
  }

  remove(id: string): void {
    const list = this._list()
      .filter((e) => e.id !== id)
      .map((e, i) => ({ ...e, ordre: i + 1 }));
    this._list.set(list);
    this.echeancesChange.emit(list);
  }

  patch(id: string, patch: Partial<EcheancePaiement>): void {
    const list = this._list().map((e) => (e.id === id ? { ...e, ...patch } : e));
    this._list.set(list);
    this.echeancesChange.emit(list);
  }
}
