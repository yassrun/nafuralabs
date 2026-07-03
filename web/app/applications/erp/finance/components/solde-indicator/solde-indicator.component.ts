import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';

@Component({
  selector: 'app-solde-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="si" [attr.data-tone]="tone()">
      <div class="si__main">{{ formatted() }}</div>
      @if (variation() != null && variation() !== 0) {
        <div class="si__var" [attr.data-pos]="variation()! > 0">
          <span class="si__var-arrow">{{ variation()! > 0 ? '▲' : '▼' }}</span>
          {{ formatVariation(variation()) }}
          @if (variationLabel()) {
            <span class="si__var-label">{{ variationLabel() }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .si {
        display: inline-flex;
        flex-direction: column;
        gap: 2px;
      }
      .si__main {
        font-size: 22px;
        font-weight: 700;
        color: var(--nf-text-primary);
        font-variant-numeric: tabular-nums;
      }
      .si[data-tone='positive'] .si__main {
        color: var(--nf-color-success-700);
      }
      .si[data-tone='warning'] .si__main {
        color: var(--nf-color-warning-700);
      }
      .si[data-tone='negative'] .si__main {
        color: var(--nf-color-danger-700);
      }
      .si__var {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--nf-color-text-secondary);
      }
      .si__var[data-pos='true'] .si__var-arrow {
        color: var(--nf-color-success-700);
      }
      .si__var[data-pos='false'] .si__var-arrow {
        color: var(--nf-color-danger-700);
      }
      .si__var-label {
        font-weight: 500;
        color: var(--nf-color-text-muted);
      }
    `,
  ],
})
export class SoldeIndicatorComponent {
  readonly value = input.required<number>();
  readonly currency = input<string>('MAD');
  readonly variation = input<number | null | undefined>(null);
  readonly variationLabel = input<string>('');
  readonly threshold = input<number>(0);
  private readonly locale = inject(LOCALE_ID);

  readonly formatted = computed(() => {
    return this.value().toLocaleString(this.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ' + this.currency();
  });

  readonly tone = computed<'default' | 'positive' | 'warning' | 'negative'>(() => {
    const v = this.value();
    const t = this.threshold();
    if (v < 0) return 'negative';
    if (v < t) return 'warning';
    return 'default';
  });

  formatVariation(v: number | null | undefined): string {
    if (v == null) return '';
    const abs = Math.abs(v);
    let str: string;
    if (abs >= 1_000_000) str = (abs / 1_000_000).toFixed(1) + ' M';
    else if (abs >= 1_000) str = (abs / 1_000).toFixed(0) + ' K';
    else str = abs.toFixed(0);
    return (v > 0 ? '+' : '-') + str + ' ' + this.currency();
  }
}
