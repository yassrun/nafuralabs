import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { CompteFinancier, CompteFinancierStats } from '../../models';
import { SoldeIndicatorComponent } from '../solde-indicator/solde-indicator.component';
import { ButtonComponent } from '@lib/anatomy/components';


@Component({
  selector: 'app-compte-financier-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, SoldeIndicatorComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="cfc" [attr.data-type]="compte().type" (click)="open.emit()">
      <header class="cfc__head">
        <div class="cfc__title">
          <span class="cfc__icon">{{ compte().type === 'BANQUE' ? '🏦' : '💵' }}</span>
          <div>
            <div class="cfc__libelle">{{ compte().libelle }}</div>
            <div class="cfc__code">
              {{ compte().compteCgncCode }} — {{ compte().code }}
            </div>
          </div>
        </div>
        @if (!compte().isActive) {
          <span class="cfc__badge cfc__badge--off">{{ 'finance.compte.financierCard.inactive' | translate }}</span>
        }
      </header>

      @if (compte().type === 'BANQUE' && compte().rib) {
        <div class="cfc__rib">
          <span class="cfc__rib-label">{{ 'finance.compte.financierCard.rib' | translate }}</span>
          <span class="cfc__rib-value">{{ compte().rib }}</span>
        </div>
      }

      <div class="cfc__solde">
        <span class="cfc__solde-label">{{ 'finance.compte.financierCard.currentBalance' | translate }}</span>
        <app-solde-indicator
          [value]="compte().soldeActuel"
          [currency]="compte().devise"
          [variation]="stats()?.variation24h ?? null"
          [variationLabel]="stats()?.variation24h ? vsYesterday() : ''"
        />
      </div>

      @if (stats(); as s) {
        <div class="cfc__stats">
          <div class="cfc__stat">
            <span class="cfc__stat-label">{{ 'finance.compte.financierCard.mvtsThisMonth' | translate }}</span>
            <span class="cfc__stat-value">{{ s.nbMouvementsMois }}</span>
          </div>
          <div class="cfc__stat">
            <span class="cfc__stat-label">{{ 'finance.compte.financierCard.recettes' | translate }}</span>
            <span class="cfc__stat-value cfc__stat-value--pos">
              {{ formatCompact(s.totalRecettesMois) }}
            </span>
          </div>
          <div class="cfc__stat">
            <span class="cfc__stat-label">{{ 'finance.compte.financierCard.depenses' | translate }}</span>
            <span class="cfc__stat-value cfc__stat-value--neg">
              {{ formatCompact(s.totalDepensesMois) }}
            </span>
          </div>
        </div>
      }

      <footer class="cfc__actions">
        <nf-button variant="primary" class="cfc__btn" (clicked)="$event.stopPropagation(); openMouvements.emit()">
          {{ 'finance.compte.financierCard.viewMvts' | translate }}
        </nf-button>
        <nf-button variant="ghost" class="cfc__btn cfc__btn--ghost" (clicked)="$event.stopPropagation(); saisirMvt.emit()">
          {{ 'finance.compte.financierCard.newMvt' | translate }}
        </nf-button>
      </footer>
    </article>
  `,
  styles: [
    `
      .cfc {
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 14px;
        padding: 18px 18px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        cursor: pointer;
        min-height: 220px;
      }
      .cfc:hover {
        border-color: var(--nf-color-primary-300);
        box-shadow: 0 6px 16px -8px rgba(15, 23, 42, 0.12);
        transform: translateY(-1px);
      }
      .cfc[data-type='BANQUE'] {
        border-top: 3px solid var(--nf-color-primary-600);
      }
      .cfc[data-type='CAISSE'] {
        border-top: 3px solid var(--nf-color-warning-500);
      }

      .cfc__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .cfc__title {
        display: flex;
        gap: 10px;
      }
      .cfc__icon {
        font-size: 20px;
      }
      .cfc__libelle {
        font-size: 15px;
        font-weight: 600;
        color: var(--nf-text-primary);
        line-height: 1.3;
      }
      .cfc__code {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
        margin-top: 2px;
      }
      .cfc__badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 999px;
      }
      .cfc__badge--off {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
      }

      .cfc__rib {
        font-size: 11px;
        display: flex;
        gap: 6px;
        align-items: center;
        background: var(--nf-color-bg-subtle);
        padding: 6px 10px;
        border-radius: 6px;
      }
      .cfc__rib-label {
        color: var(--nf-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }
      .cfc__rib-value {
        font-family: ui-monospace, SF Mono, Menlo, monospace;
        color: var(--nf-color-text-secondary);
      }

      .cfc__solde {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .cfc__solde-label {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }

      .cfc__stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding-top: 10px;
        border-top: 1px dashed var(--nf-color-border);
      }
      .cfc__stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .cfc__stat-label {
        font-size: 10px;
        color: var(--nf-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .cfc__stat-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--nf-text-primary);
        font-variant-numeric: tabular-nums;
      }
      .cfc__stat-value--pos {
        color: var(--nf-color-success-700);
      }
      .cfc__stat-value--neg {
        color: var(--nf-color-danger-700);
      }

      .cfc__actions {
        display: flex;
        gap: 8px;
        margin-top: auto;
      }
      .cfc__btn {
        flex: 1;
        padding: 8px 12px;
        border-radius: 6px;
        background: var(--nf-color-primary-600);
        color: white;
        border: none;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }
      .cfc__btn:hover {
        background: var(--nf-color-primary-700);
      }
      .cfc__btn--ghost {
        background: transparent;
        color: var(--nf-color-primary-600);
        border: 1px solid var(--nf-color-border);
      }
      .cfc__btn--ghost:hover {
        background: var(--nf-color-bg-subtle);
        border-color: var(--nf-color-primary-300);
      }
    `,
  ],
})
export class CompteFinancierCardComponent {
  private readonly translate = inject(TranslateService);

  readonly compte = input.required<CompteFinancier>();
  readonly stats = input<CompteFinancierStats | null>(null);

  readonly open = output<void>();
  readonly openMouvements = output<void>();
  readonly saisirMvt = output<void>();

  vsYesterday(): string {
    return this.translate.instant('finance.compte.financierCard.vsYesterday');
  }

  formatCompact(v: number): string {
    if (v == null) return '—';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + ' K';
    return v.toFixed(0);
  }
}
