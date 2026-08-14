import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';

/**
 * Cellule "Délai échéance" pour une facture.
 *
 * - Si la facture est payée, on affiche "Soldée" sans tonalité d'urgence.
 * - Sinon, on calcule le nombre de jours de retard (dépassement échéance) ou
 *   le nombre de jours restants. Couleur : retard rouge, < 7j danger, < 30j warn,
 *   sinon ok.
 */
@Component({
  selector: 'app-delai-echeance-cell',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="dec" [attr.data-tone]="tone()">
      <span class="dec__count">{{ label() }}</span>
      <span class="dec__date">{{ formattedDate() }}</span>
    </span>
  `,
  styles: [
    `
      .dec {
        display: inline-flex;
        flex-direction: column;
        gap: 2px;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.2;
        min-width: 96px;
      }
      .dec__count {
        font-weight: 700;
      }
      .dec__date {
        font-size: 11px;
        opacity: 0.85;
      }
      .dec[data-tone='ok'] {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }
      .dec[data-tone='warn'] {
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
      }
      .dec[data-tone='danger'] {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-700);
      }
      .dec[data-tone='past'] {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-700);
      }
      .dec[data-tone='paid'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-800);
      }
    `,
  ],
})
export class DelaiEcheanceCellComponent {
  readonly dateEcheance = input<string | null | undefined>(null);
  readonly status = input<string | null | undefined>(null);
  readonly referenceDate = input<Date>(new Date('2026-05-08'));
  private readonly locale = inject(LOCALE_ID);

  readonly daysRemaining = computed<number | null>(() => {
    const date = this.dateEcheance();
    if (!date) return null;
    const target = new Date(date);
    if (Number.isNaN(target.getTime())) return null;
    const ref = this.referenceDate();
    const diff = target.getTime() - ref.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  });

  readonly isPaid = computed(() => this.status() === 'PAYEE');

  readonly tone = computed<'ok' | 'warn' | 'danger' | 'past' | 'paid'>(() => {
    if (this.isPaid()) return 'paid';
    const d = this.daysRemaining();
    if (d == null) return 'ok';
    if (d < 0) return 'past';
    if (d < 7) return 'danger';
    if (d < 30) return 'warn';
    return 'ok';
  });

  readonly label = computed(() => {
    if (this.isPaid()) return 'Soldée';
    const d = this.daysRemaining();
    if (d == null) return '—';
    if (d < 0) return `+${Math.abs(d)} j retard`;
    if (d === 0) return 'Échéance ajd';
    return `J − ${d}`;
  });

  readonly formattedDate = computed(() => {
    const date = this.dateEcheance();
    if (!date) return '';
    const target = new Date(date);
    if (Number.isNaN(target.getTime())) return date;
    return target.toLocaleDateString(this.locale);
  });
}
