import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MOUVEMENT_TRESORERIE_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import type { MouvementTresorerie, MouvementTresorerieType } from '../../models';

const TYPE_VARIANT: Record<MouvementTresorerieType, string> = {
  REGLEMENT_CLIENT: 'success',
  REGLEMENT_FOURN: 'warning',
  PAIEMENT_PAIE: 'info',
  VIREMENT_INTERNE: 'info',
  FRAIS_BANCAIRES: 'default',
  COMMISSIONS: 'default',
  AUTRE_RECETTE: 'success',
  AUTRE_DEPENSE: 'warning',
};

@Component({
  selector: 'app-mouvement-row',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tr class="mvr">
      <td class="mvr__date">{{ formatDate(mvt().date) }}</td>
      <td class="mvr__num">{{ mvt().numero }}</td>
      <td>
        <span class="mvr__type" [attr.data-variant]="typeVariant()">
          {{ typeLabel() | translate }}
        </span>
      </td>
      <td class="mvr__libelle">
        <div class="mvr__libelle-main">{{ mvt().libelle }}</div>
        @if (mvt().contrePartieName) {
          <div class="mvr__contrepartie">{{ mvt().contrePartieName }}</div>
        }
      </td>
      <td class="mvr__ref">{{ mvt().reference || ('finance.common.dash' | translate) }}</td>
      <td class="mvr__num-cell mvr__recette">
        @if (mvt().recette > 0) {
          {{ format(mvt().recette) }}
        } @else {
          <span class="mvr__dash">{{ 'finance.common.dash' | translate }}</span>
        }
      </td>
      <td class="mvr__num-cell mvr__depense">
        @if (mvt().depense > 0) {
          {{ format(mvt().depense) }}
        } @else {
          <span class="mvr__dash">{{ 'finance.common.dash' | translate }}</span>
        }
      </td>
      @if (showSolde()) {
        <td class="mvr__num-cell mvr__solde">
          @if (soldeApres() != null) {
            {{ format(soldeApres()!) }}
          }
        </td>
      }
      <td class="mvr__rapproche">
        @if (mvt().rapprocheId) {
          <span class="mvr__rapproche-icon" [title]="'finance.mouvement.row.matched' | translate">✓</span>
        } @else {
          <span class="mvr__dash">·</span>
        }
      </td>
    </tr>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .mvr td {
        padding: 8px 12px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        font-size: 13px;
        color: var(--nf-color-text-primary);
        vertical-align: middle;
      }
      .mvr__date {
        white-space: nowrap;
        color: var(--nf-color-text-secondary);
        font-variant-numeric: tabular-nums;
      }
      .mvr__num {
        font-family: ui-monospace, SF Mono, Menlo, monospace;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
        white-space: nowrap;
      }
      .mvr__type {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 999px;
        white-space: nowrap;
      }
      .mvr__type[data-variant='success'] {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }
      .mvr__type[data-variant='warning'] {
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
      }
      .mvr__type[data-variant='info'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-700);
      }
      .mvr__type[data-variant='default'] {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
      }
      .mvr__libelle-main {
        color: var(--nf-text-primary);
        font-weight: 500;
      }
      .mvr__contrepartie {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
        margin-top: 1px;
      }
      .mvr__ref {
        font-family: ui-monospace, SF Mono, Menlo, monospace;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .mvr__num-cell {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        white-space: nowrap;
      }
      .mvr__recette {
        color: var(--nf-color-success-700);
      }
      .mvr__depense {
        color: var(--nf-color-danger-700);
      }
      .mvr__solde {
        color: var(--nf-text-primary);
      }
      .mvr__dash {
        color: var(--nf-color-border);
        font-weight: 400;
      }
      .mvr__rapproche {
        text-align: center;
      }
      .mvr__rapproche-icon {
        display: inline-flex;
        width: 18px;
        height: 18px;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
        font-size: 11px;
        font-weight: 700;
      }
    `,
  ],
})
export class MouvementRowComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly mvt = input.required<MouvementTresorerie>();
  readonly soldeApres = input<number | null>(null);
  readonly showSolde = input<boolean>(true);

  readonly typeLabel = computed(() => MOUVEMENT_TRESORERIE_TYPE_KEYS[this.mvt().type]);
  readonly typeVariant = computed(() => TYPE_VARIANT[this.mvt().type]);

  format(v: number): string {
    return v.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString(this.locale);
  }
}
