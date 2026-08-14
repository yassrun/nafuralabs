import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import type { Devise, TauxChange } from '../../models';
import { DeviseFlagComponent } from '../devise-flag/devise-flag.component';

@Component({
  selector: 'app-taux-change-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DeviseFlagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="conv">
      <div class="conv__row">
        <div class="conv__col">
          <label>{{ 'finance.tauxChange.converter.amount' | translate }}</label>
          <input
            type="number"
            [ngModel]="amount()"
            (ngModelChange)="amount.set($event ?? 0)"
            min="0"
            step="0.01" />
        </div>
        <div class="conv__col">
          <label>{{ 'finance.tauxChange.converter.from' | translate }}</label>
          <select [ngModel]="fromCode()" (ngModelChange)="fromCode.set($event)">
            @for (d of devises(); track d.id) {
              <option [value]="d.code">{{ d.code }} — {{ d.libelle }}</option>
            }
          </select>
        </div>
        <div class="conv__col">
          <label>{{ 'finance.tauxChange.converter.to' | translate }}</label>
          <select [ngModel]="toCode()" (ngModelChange)="toCode.set($event)">
            @for (d of devises(); track d.id) {
              <option [value]="d.code">{{ d.code }} — {{ d.libelle }}</option>
            }
          </select>
        </div>
      </div>

      <div class="conv__result">
        <div class="conv__amount">
          <app-devise-flag [code]="fromCode()" [showCode]="false" size="lg" />
          <strong>{{ formatAmount(amount(), fromCode()) }}</strong>
        </div>
        <div class="conv__arrow">→</div>
        <div class="conv__amount conv__amount--out">
          <app-devise-flag [code]="toCode()" [showCode]="false" size="lg" />
          <strong>{{ formatAmount(converted(), toCode()) }}</strong>
        </div>
      </div>

      <div class="conv__rate">
        <span>1 {{ fromCode() }} = {{ rate() | number: '1.4-4' }} {{ toCode() }}</span>
        @if (latestTauxDate(); as d) {
          <span class="conv__date">{{ 'finance.tauxChange.converter.asOf' | translate }} {{ formatDate(d) }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .conv {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 12px;
      }
      .conv__row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .conv__col {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .conv__col label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        font-weight: 600;
      }
      .conv__col input,
      .conv__col select {
        border: 1px solid var(--nf-color-primary-200);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--nf-color-surface);
      }
      .conv__result {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--nf-color-surface);
        border-radius: 10px;
        border: 1px solid var(--nf-color-border);
      }
      .conv__amount {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 16px;
        flex: 1;
      }
      .conv__amount--out {
        justify-content: flex-end;
        color: var(--nf-color-primary-700);
      }
      .conv__arrow {
        color: var(--nf-color-text-muted);
        font-size: 20px;
      }
      .conv__rate {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .conv__date {
        color: var(--nf-color-text-muted);
      }
    `,
  ],
})
export class TauxChangeConverterComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly devises = input<Devise[]>([]);
  readonly taux = input<TauxChange[]>([]);
  readonly defaultFrom = input<string>('EUR');
  readonly defaultTo = input<string>('MAD');

  readonly amount = signal<number>(1000);
  readonly fromCode = signal<string>('');
  readonly toCode = signal<string>('');

  readonly latestTaux = computed(() => {
    const from = this.fromCode() || this.defaultFrom();
    const to = this.toCode() || this.defaultTo();
    const rows = this.taux().filter(
      (t) => t.deviseDeCode === from && t.deviseVersCode === to,
    );
    if (!rows.length) return undefined;
    return rows.sort((a, b) => b.dateValidite.localeCompare(a.dateValidite))[0];
  });

  readonly latestTauxDate = computed(() => this.latestTaux()?.dateValidite);
  readonly rate = computed(() => this.latestTaux()?.taux ?? 1);
  readonly converted = computed(() => this.amount() * this.rate());

  constructor() {
    queueMicrotask(() => {
      if (!this.fromCode()) this.fromCode.set(this.defaultFrom());
      if (!this.toCode()) this.toCode.set(this.defaultTo());
    });
  }

  formatAmount(value: number, code: string): string {
    if (!Number.isFinite(value)) return '—';
    return `${value.toLocaleString(this.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${code}`;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString(this.locale);
  }
}
