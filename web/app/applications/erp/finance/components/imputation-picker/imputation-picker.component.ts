import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, LOCALE_ID, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import type { FactureOuverte, ReglementImputation } from '../../models';
import { ButtonComponent } from '@lib/anatomy/components';


interface ImputationDraft {
  factureId: string;
  factureNumero: string;
  factureDate: string;
  factureEcheance: string;
  factureRestant: number;
  selected: boolean;
  montantImpute: number;
}

@Component({
  selector: 'app-imputation-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ip">
      <div class="ip__head">
        <div class="ip__head-info">
          <span class="ip__count">{{ 'finance.imputation.openInvoices' | translate: { count: factures().length } }}</span>
          <span class="ip__total-due">{{ 'finance.imputation.totalDue' | translate }} : {{ format(totalDue()) }} {{ 'finance.common.currency.mad' | translate }}</span>
        </div>
        <div class="ip__montant-input">
          <label>{{ (type() === 'CLIENT' ? 'finance.imputation.amountReceived' : 'finance.imputation.amountToPay') | translate }}</label>
          <input
            type="number"
            [ngModel]="montantTotal()"
            (ngModelChange)="onMontantChange($event)"
            min="0"
            step="0.01"
            class="ip__input"
          />
          <span class="ip__currency">{{ 'finance.common.currency.mad' | translate }}</span>
          <nf-button variant="primary" class="ip__btn ip__btn--auto" (clicked)="affecterAuto()">
            {{ 'finance.imputation.autoAllocate' | translate }}
          </nf-button>
        </div>
      </div>

      @if (factures().length === 0) {
        <div class="ip__empty">
          @if (contrePartieId()) {
            {{ 'finance.imputation.emptyForContrepartie' | translate }}
          } @else {
            {{ 'finance.imputation.emptySelectContrepartie' | translate }}
          }
        </div>
      } @else {
        <table class="ip__table">
          <thead>
            <tr>
              <th class="ip__th-check"></th>
              <th>{{ 'finance.imputation.cols.numero' | translate }}</th>
              <th>{{ 'finance.imputation.cols.date' | translate }}</th>
              <th>{{ 'finance.imputation.cols.echeance' | translate }}</th>
              <th class="ip__th-num">{{ 'finance.imputation.cols.resteARegler' | translate }}</th>
              <th class="ip__th-num">{{ 'finance.imputation.cols.impute' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (d of drafts(); track d.factureId) {
              <tr [class.ip__row--selected]="d.selected">
                <td class="ip__td-check">
                  <input
                    type="checkbox"
                    [checked]="d.selected"
                    (change)="toggle(d.factureId, $any($event.target).checked)"
                  />
                </td>
                <td class="ip__num-col">{{ d.factureNumero }}</td>
                <td>{{ formatDate(d.factureDate) }}</td>
                <td>
                  <span [class.ip__overdue]="isOverdue(d.factureEcheance)">
                    {{ formatDate(d.factureEcheance) }}
                  </span>
                </td>
                <td class="ip__td-num">{{ format(d.factureRestant) }}</td>
                <td class="ip__td-num">
                  <input
                    type="number"
                    [ngModel]="d.montantImpute"
                    (ngModelChange)="onImputeChange(d.factureId, $event)"
                    [disabled]="!d.selected"
                    min="0"
                    [max]="d.factureRestant"
                    step="0.01"
                    class="ip__input ip__input--small"
                  />
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="ip__sum-label">{{ 'finance.imputation.totalImpute' | translate }}</td>
              <td class="ip__td-num">{{ format(totalSelected()) }}</td>
              <td class="ip__td-num" [class.ip__diff--ok]="diff() === 0" [class.ip__diff--ko]="diff() !== 0">
                {{ format(totalImpute()) }}
              </td>
            </tr>
            @if (diff() !== 0) {
              <tr>
                <td colspan="5" class="ip__sum-label">{{ 'finance.common.labels.ecart' | translate }}</td>
                <td class="ip__td-num ip__diff--ko">{{ format(diff()) }}</td>
              </tr>
            }
          </tfoot>
        </table>
      }
    </div>
  `,
  styles: [
    `
      .ip {
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 10px;
        padding: 16px;
      }
      .ip__head {
        display: flex;
        gap: 16px;
        align-items: flex-end;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .ip__head-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .ip__count {
        font-size: 13px;
        font-weight: 600;
        color: var(--nf-text-primary);
      }
      .ip__total-due {
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .ip__montant-input {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ip__montant-input label {
        font-size: 12px;
        font-weight: 600;
        color: var(--nf-color-text-secondary);
      }
      .ip__input {
        padding: 6px 10px;
        font-size: 13px;
        border-radius: 6px;
        border: 1px solid var(--nf-color-border);
        width: 140px;
        font-variant-numeric: tabular-nums;
      }
      .ip__input--small {
        width: 110px;
        text-align: right;
      }
      .ip__currency {
        font-size: 12px;
        color: var(--nf-color-text-secondary);
        font-weight: 600;
      }
      .ip__btn {
        padding: 6px 12px;
        font-size: 12px;
        border-radius: 6px;
        border: 1px solid var(--nf-color-border);
        background: var(--nf-color-surface);
        color: var(--nf-color-primary-600);
        cursor: pointer;
        font-weight: 600;
      }
      .ip__btn:hover {
        border-color: var(--nf-color-primary-300);
        background: var(--nf-color-primary-50);
      }
      .ip__empty {
        padding: 24px;
        text-align: center;
        color: var(--nf-color-text-secondary);
        font-size: 13px;
        font-style: italic;
      }
      .ip__table {
        width: 100%;
        border-collapse: collapse;
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 6px;
        overflow: hidden;
      }
      .ip__table th {
        background: var(--nf-color-bg-muted);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        padding: 8px 10px;
        text-align: left;
      }
      .ip__th-num {
        text-align: right;
      }
      .ip__th-check {
        width: 40px;
      }
      .ip__table td {
        padding: 8px 10px;
        font-size: 13px;
        border-top: 1px solid var(--nf-color-bg-muted);
        color: var(--nf-color-text-primary);
      }
      .ip__row--selected {
        background: var(--nf-color-primary-50);
      }
      .ip__td-check {
        width: 40px;
      }
      .ip__num-col {
        font-family: ui-monospace, SF Mono, Menlo, monospace;
        font-size: 12px;
        font-weight: 600;
      }
      .ip__td-num {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
      }
      .ip__overdue {
        color: var(--nf-color-danger-700);
        font-weight: 600;
      }
      .ip__table tfoot td {
        background: var(--nf-color-bg-subtle);
        font-weight: 600;
      }
      .ip__sum-label {
        text-align: right;
        color: var(--nf-color-text-secondary);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.05em;
      }
      .ip__diff--ok {
        color: var(--nf-color-success-700);
      }
      .ip__diff--ko {
        color: var(--nf-color-danger-700);
      }
    `,
  ],
})
export class ImputationPickerComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly type = input.required<'CLIENT' | 'FOURNISSEUR'>();
  readonly factures = input<FactureOuverte[]>([]);
  readonly contrePartieId = input<string | null>(null);
  readonly initialMontantTotal = input<number>(0);
  readonly initialImputations = input<ReglementImputation[]>([]);

  readonly imputationsChange = output<ReglementImputation[]>();
  readonly montantTotalChange = output<number>();

  protected readonly montantTotal = signal<number>(0);
  protected readonly drafts = signal<ImputationDraft[]>([]);

  readonly totalDue = computed(() =>
    this.factures().reduce((s, f) => s + f.resteARegler, 0),
  );

  readonly totalSelected = computed(() =>
    this.drafts()
      .filter((d) => d.selected)
      .reduce((s, d) => s + d.factureRestant, 0),
  );

  readonly totalImpute = computed(() =>
    this.drafts()
      .filter((d) => d.selected)
      .reduce((s, d) => s + (d.montantImpute || 0), 0),
  );

  readonly diff = computed(() => Math.round((this.totalImpute() - this.montantTotal()) * 100) / 100);

  constructor() {
    let initialised = false;
    effect(() => {
      // Sync initial montant
      if (!initialised) {
        const m = this.initialMontantTotal();
        if (m && m > 0) this.montantTotal.set(m);
        initialised = true;
      }
    });
    effect(() => {
      const facs = this.factures();
      const initImp = this.initialImputations();
      const drafts: ImputationDraft[] = facs.map((f) => {
        const found = initImp.find((i) => i.factureId === f.id);
        return {
          factureId: f.id,
          factureNumero: f.numero,
          factureDate: f.date,
          factureEcheance: f.echeance,
          factureRestant: f.resteARegler,
          selected: !!found,
          montantImpute: found?.montantImpute ?? 0,
        };
      });
      this.drafts.set(drafts);
    });
  }

  onMontantChange(v: number): void {
    const val = Math.max(0, Number(v) || 0);
    this.montantTotal.set(val);
    this.montantTotalChange.emit(val);
  }

  toggle(factureId: string, checked: boolean): void {
    this.drafts.set(
      this.drafts().map((d) =>
        d.factureId === factureId
          ? {
              ...d,
              selected: checked,
              montantImpute: checked ? d.montantImpute || d.factureRestant : 0,
            }
          : d,
      ),
    );
    this.emit();
  }

  onImputeChange(factureId: string, value: number): void {
    const v = Number(value) || 0;
    this.drafts.set(
      this.drafts().map((d) =>
        d.factureId === factureId
          ? { ...d, montantImpute: Math.max(0, Math.min(v, d.factureRestant)) }
          : d,
      ),
    );
    this.emit();
  }

  affecterAuto(): void {
    const target = this.montantTotal();
    if (target <= 0) {
      // Reset
      this.drafts.set(this.drafts().map((d) => ({ ...d, selected: false, montantImpute: 0 })));
      this.emit();
      return;
    }
    const sorted = [...this.drafts()].sort((a, b) =>
      a.factureEcheance < b.factureEcheance ? -1 : 1,
    );
    let remaining = target;
    const newDrafts = sorted.map((d) => {
      if (remaining <= 0) {
        return { ...d, selected: false, montantImpute: 0 };
      }
      const apply = Math.min(d.factureRestant, remaining);
      remaining -= apply;
      return { ...d, selected: true, montantImpute: Math.round(apply * 100) / 100 };
    });
    // Reorder back to original facture order
    const byId = new Map(newDrafts.map((d) => [d.factureId, d]));
    this.drafts.set(this.drafts().map((d) => byId.get(d.factureId) ?? d));
    this.emit();
  }

  private emit(): void {
    const imputations: ReglementImputation[] = this.drafts()
      .filter((d) => d.selected && d.montantImpute > 0)
      .map((d, idx) => ({
        id: `imp-${idx + 1}`,
        reglementId: '',
        factureId: d.factureId,
        factureNumero: d.factureNumero,
        factureDate: d.factureDate,
        factureEcheance: d.factureEcheance,
        factureRestant: d.factureRestant,
        montantImpute: d.montantImpute,
      }));
    this.imputationsChange.emit(imputations);
  }

  format(v: number): string {
    return (v ?? 0).toLocaleString(this.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(this.locale);
  }

  isOverdue(d: string): boolean {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
  }
}
