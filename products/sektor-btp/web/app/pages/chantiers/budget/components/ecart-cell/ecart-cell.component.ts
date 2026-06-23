import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, LOCALE_ID, inject, input } from '@angular/core';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

@Component({
  selector: 'app-ecart-cell',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe, DecimalPipe],
  template: `
    <div class="ecart" [class.ecart--negative]="value() < 0" [class.ecart--positive]="value() >= 0" [title]="tooltip()">
      <strong>{{ value() | mad }}</strong>
      <span>{{ percent() | number:'1.0-1' }}%</span>
    </div>
  `,
  styles: [`
    .ecart { display: grid; gap: 0.15rem; }
    .ecart strong { font-size: 0.95rem; }
    .ecart span { font-size: 0.78rem; }
    .ecart--positive { color: var(--nf-color-success-700); }
    .ecart--negative { color: var(--nf-color-danger-700); }
  `],
})
export class EcartCellComponent {
  readonly value = input.required<number>();
  readonly percent = input.required<number>();
  private readonly locale = inject(LOCALE_ID);

  tooltip(): string {
    return `Ecart revise - realise: ${this.value().toLocaleString(this.locale)} MAD (${this.percent().toFixed(1)}%)`;
  }
}
