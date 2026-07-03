import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge visuel pour comparer quantité demandée vs stock disponible (spec BTP bons de sortie).
 */
@Component({
  selector: 'app-stock-qty-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="sqc" [class]="toneClass()">
      {{ available() | number: '1.0-2' }}
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .sqc {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .sqc--ok {
      background: color-mix(in srgb, var(--nf-success, var(--nf-color-success-600)) 18%, transparent);
      color: var(--nf-success, var(--nf-color-success-700));
    }
    .sqc--warn {
      background: color-mix(in srgb, var(--nf-warning, var(--nf-color-warning-600)) 20%, transparent);
      color: var(--nf-warning);
    }
    .sqc--bad {
      background: color-mix(in srgb, var(--nf-danger, var(--nf-color-danger-600)) 18%, transparent);
      color: var(--nf-danger, var(--nf-color-danger-700));
    }
  `,
})
export class StockQtyCellComponent {
  readonly requested = input.required<number>();
  readonly available = input.required<number>();

  readonly toneClass = computed(() => {
    const req = this.requested();
    const av = this.available();
    if (req > av) {
      return 'sqc--bad';
    }
    if (av > 0 && req > av * 0.85) {
      return 'sqc--warn';
    }
    return 'sqc--ok';
  });
}
