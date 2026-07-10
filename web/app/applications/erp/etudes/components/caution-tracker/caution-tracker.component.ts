import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-caution-tracker',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cau">
      <div class="cau__row">
        <span class="cau__label">Provisoire</span>
        <span class="cau__value">{{ formatCaution(provisoire()) }}</span>
      </div>
      <div class="cau__row">
        <span class="cau__label">{{ 'chantiers.etudes.cautionTracker.definitive' | translate }}</span>
        <span class="cau__value">{{ formatCaution(definitive()) }}</span>
      </div>
      <div class="cau__row">
        <span class="cau__label">Retenue garantie</span>
        <span class="cau__value">{{ formatCaution(retenue()) }}</span>
      </div>
      <div class="cau__total">
        <span>{{ 'chantiers.etudes.cautionTracker.totalCautions' | translate }}</span>
        <span>{{ formatCaution(total()) }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .cau {
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        min-width: 220px;
      }
      .cau__row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        color: var(--nf-color-text-secondary);
      }
      .cau__value {
        font-weight: 600;
        color: var(--nf-text-primary);
      }
      .cau__total {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid var(--nf-color-border);
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        color: var(--nf-color-primary-700);
        font-size: 14px;
      }
    `,
  ],
})
export class CautionTrackerComponent {
  readonly provisoire = input<number | null | undefined>(null);
  readonly definitive = input<number | null | undefined>(null);
  readonly retenue = input<number | null | undefined>(null);

  readonly total = computed(
    () => (this.provisoire() ?? 0) + (this.definitive() ?? 0) + (this.retenue() ?? 0),
  );

  private readonly locale = inject(LOCALE_ID);

  formatCaution(value: number | null | undefined): string {
    if (value == null || value === 0) return '—';
    return (
      value.toLocaleString(this.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) +
      ' MAD'
    );
  }
}
