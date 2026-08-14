import { Component, computed, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

/**
 * Quantity Status Cell Component
 *
 * Displays quantity with color coding based on stock minimum:
 * - Green: quantity > min
 * - Orange: quantity approaching min (within 20%)
 * - Red: quantity < min or exhausted
 */
@Component({
  selector: 'app-quantity-status-cell',
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe],
  template: `
    <span class="qsc" [class]="statusClass()">
      {{ quantity() | number: '1.0-2' }}
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .qsc {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 600;
      min-width: 48px;
      justify-content: center;
    }
    .qsc--ok {
      background: color-mix(in srgb, var(--nf-success, var(--nf-color-success-600)) 18%, transparent);
      color: var(--nf-success, var(--nf-color-success-700));
    }
    .qsc--warn {
      background: color-mix(in srgb, var(--nf-warning, var(--nf-color-warning-600)) 20%, transparent);
      color: var(--nf-warning);
    }
    .qsc--critical {
      background: color-mix(in srgb, var(--nf-danger, var(--nf-color-danger-600)) 18%, transparent);
      color: var(--nf-danger, var(--nf-color-danger-700));
    }
  `,
})
export class QuantityStatusCellComponent {
  readonly quantity = input.required<number>();
  readonly stockMin = input<number | undefined>(undefined);

  readonly statusClass = computed(() => {
    const qty = this.quantity();
    const min = this.stockMin();

    if (qty === 0) {
      return 'qsc qsc--critical';
    }

    if (min == null) {
      return 'qsc qsc--ok';
    }

    if (qty < min) {
      return 'qsc qsc--critical';
    }

    const threshold = min * 1.2;
    if (qty <= threshold) {
      return 'qsc qsc--warn';
    }

    return 'qsc qsc--ok';
  });
}
