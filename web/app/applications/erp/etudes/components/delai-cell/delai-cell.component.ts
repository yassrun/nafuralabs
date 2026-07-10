import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';

@Component({
  selector: 'app-delai-cell',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="dlc" [attr.data-tone]="tone()">
      <span class="dlc__count">{{ daysLabel() }}</span>
      <span class="dlc__date">{{ formattedDate() }}</span>
    </span>
  `,
  styles: [
    `
      .dlc {
        display: inline-flex;
        flex-direction: column;
        gap: 2px;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.2;
        min-width: 92px;
      }
      .dlc__count {
        font-weight: 700;
      }
      .dlc__date {
        font-size: 11px;
        opacity: 0.85;
      }
      .dlc[data-tone='ok'] {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }
      .dlc[data-tone='warn'] {
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
      }
      .dlc[data-tone='danger'] {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-700);
      }
      .dlc[data-tone='past'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-800);
      }
    `,
  ],
})
export class DelaiCellComponent {
  readonly date = input<string | null | undefined>(null);
  readonly referenceDate = input<Date>(new Date('2026-05-08'));
  private readonly locale = inject(LOCALE_ID);

  readonly daysRemaining = computed<number | null>(() => {
    const date = this.date();
    if (!date) return null;
    const target = new Date(date);
    if (Number.isNaN(target.getTime())) return null;
    const ref = this.referenceDate();
    const diff = target.getTime() - ref.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  });

  readonly tone = computed<'ok' | 'warn' | 'danger' | 'past'>(() => {
    const d = this.daysRemaining();
    if (d == null) return 'ok';
    if (d < 0) return 'past';
    if (d < 7) return 'danger';
    if (d < 30) return 'warn';
    return 'ok';
  });

  readonly daysLabel = computed(() => {
    const d = this.daysRemaining();
    if (d == null) return '—';
    if (d < 0) return `Dépassé (${Math.abs(d)} j)`;
    if (d === 0) return 'Aujourd\'hui';
    return `J − ${d}`;
  });

  readonly formattedDate = computed(() => {
    const date = this.date();
    if (!date) return '';
    const target = new Date(date);
    if (Number.isNaN(target.getTime())) return date;
    return target.toLocaleDateString(this.locale);
  });
}
