import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID } from '@angular/core';

import type { RetenueGarantie } from '../../models';

const REFERENCE_DATE = new Date('2026-05-08');
const ONE_DAY = 1000 * 60 * 60 * 24;

@Component({
  selector: 'app-retenue-summary-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="rsc">
      <header class="rsc__header">
        <h3>Retenues garanties — vue consolidée</h3>
        <p class="rsc__hint">
          Suivi caution 7 % bloquée 1 an post-réception provisoire.
        </p>
      </header>

      <div class="rsc__grid">
        <div class="rsc__cell rsc__cell--total">
          <span class="rsc__label">Total bloqué</span>
          <strong>{{ formatMad(totalBloque()) }}</strong>
          <span class="rsc__sub">sur {{ chantiersBloques() }} chantiers</span>
        </div>
        <div class="rsc__cell rsc__cell--alert">
          <span class="rsc__label">À libérer &lt; 30 j</span>
          <strong>{{ formatMad(aLibererSous30j()) }}</strong>
          <span class="rsc__sub">{{ chantiersSous30j() }} chantiers</span>
        </div>
        <div class="rsc__cell rsc__cell--info">
          <span class="rsc__label">Couverte caution bancaire</span>
          <strong>{{ formatMad(couverteCaution()) }}</strong>
          <span class="rsc__sub">{{ chantiersCouverts() }} chantiers</span>
        </div>
        <div class="rsc__cell rsc__cell--success">
          <span class="rsc__label">Libérée 12 mois</span>
          <strong>{{ formatMad(libereeAnnee()) }}</strong>
          <span class="rsc__sub">{{ chantiersLiberes() }} chantiers</span>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .rsc {
        background: linear-gradient(135deg, var(--nf-color-bg-subtle) 0%, var(--nf-color-surface) 100%);
        border: 1px solid var(--nf-color-border);
        border-radius: 12px;
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .rsc__header h3 {
        margin: 0;
        font-size: 16px;
        color: var(--nf-text-primary);
        font-weight: 700;
      }
      .rsc__hint {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .rsc__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      @media (max-width: 900px) {
        .rsc__grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .rsc__cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid var(--nf-color-border);
        background: var(--nf-color-surface);
      }
      .rsc__label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--nf-color-text-secondary);
      }
      .rsc__cell strong {
        font-size: 18px;
        color: var(--nf-text-primary);
      }
      .rsc__sub {
        font-size: 11px;
        color: var(--nf-color-text-muted);
      }
      .rsc__cell--total {
        background: var(--nf-color-primary-700);
        border-color: var(--nf-color-primary-700);
      }
      .rsc__cell--total .rsc__label,
      .rsc__cell--total .rsc__sub {
        color: rgba(255, 255, 255, 0.78);
      }
      .rsc__cell--total strong {
        color: var(--nf-color-surface);
        font-size: 20px;
      }
      .rsc__cell--alert {
        background: var(--nf-color-warning-100);
        border-color: var(--nf-color-warning-300);
      }
      .rsc__cell--alert strong {
        color: var(--nf-color-warning-700);
      }
      .rsc__cell--info {
        background: var(--nf-color-primary-100);
        border-color: var(--nf-color-primary-300);
      }
      .rsc__cell--info strong {
        color: var(--nf-color-primary-700);
      }
      .rsc__cell--success {
        background: var(--nf-color-success-100);
        border-color: var(--nf-color-success-300);
      }
      .rsc__cell--success strong {
        color: var(--nf-color-success-700);
      }
    `,
  ],
})
export class RetenueSummaryCardComponent {
  readonly retenues = input.required<RetenueGarantie[]>();

  private readonly locale = inject(LOCALE_ID);
  readonly referenceDate = input<Date>(REFERENCE_DATE);

  readonly totalBloque = computed(() =>
    this.retenues()
      .filter((r) => r.status === 'EN_COURS' || r.status === 'LIBERATION_DEMANDEE')
      .reduce((s, r) => s + r.resteARelibererHt, 0),
  );

  readonly chantiersBloques = computed(
    () =>
      this.retenues().filter(
        (r) => r.status === 'EN_COURS' || r.status === 'LIBERATION_DEMANDEE',
      ).length,
  );

  readonly aLibererSous30j = computed(() =>
    this.retenues()
      .filter((r) => this.isLessThan30Days(r))
      .reduce((s, r) => s + r.resteARelibererHt, 0),
  );

  readonly chantiersSous30j = computed(
    () => this.retenues().filter((r) => this.isLessThan30Days(r)).length,
  );

  readonly couverteCaution = computed(() =>
    this.retenues()
      .filter((r) => r.cautionBanqueId)
      .reduce((s, r) => s + (r.cautionMontant ?? r.cumulRetenueHt), 0),
  );

  readonly chantiersCouverts = computed(
    () => this.retenues().filter((r) => !!r.cautionBanqueId).length,
  );

  readonly libereeAnnee = computed(() =>
    this.retenues()
      .filter((r) => this.isLibereeLast12Months(r))
      .reduce((s, r) => s + r.cumulLibereHt, 0),
  );

  readonly chantiersLiberes = computed(
    () => this.retenues().filter((r) => this.isLibereeLast12Months(r)).length,
  );

  formatMad(n: number): string {
    return n.toLocaleString(this.locale, { maximumFractionDigits: 0 }) + ' MAD';
  }

  private isLessThan30Days(r: RetenueGarantie): boolean {
    if (r.status !== 'EN_COURS' && r.status !== 'LIBERATION_DEMANDEE') return false;
    if (!r.dateLiberationPrevue) return false;
    const target = new Date(r.dateLiberationPrevue);
    if (Number.isNaN(target.getTime())) return false;
    const diffDays = Math.round(
      (target.getTime() - this.referenceDate().getTime()) / ONE_DAY,
    );
    return diffDays <= 30;
  }

  private isLibereeLast12Months(r: RetenueGarantie): boolean {
    if (r.status !== 'LIBEREE' || !r.dateLiberation) return false;
    const target = new Date(r.dateLiberation);
    if (Number.isNaN(target.getTime())) return false;
    const diffDays = Math.round(
      (this.referenceDate().getTime() - target.getTime()) / ONE_DAY,
    );
    return diffDays <= 365 && diffDays >= 0;
  }
}
