import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { ConditionPaiement } from '../../models';

@Component({
  selector: 'app-condition-paiement-display',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (condition(); as cp) {
      <span class="cp" [title]="tooltip()">
        <span class="cp__code">{{ cp.code }}</span>
        <span class="cp__libelle">{{ cp.libelle }}</span>
        @if (cp.isDefaut) {
          <span class="cp__badge cp__badge--defaut">{{ 'finance.conditionPaiement.display.default' | translate }}</span>
        }
      </span>
    } @else {
      <span class="cp cp--empty">{{ 'finance.common.dash' | translate }}</span>
    }
  `,
  styles: [
    `
      .cp {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }
      .cp__code {
        background: var(--nf-color-primary-50);
        color: var(--nf-color-primary-700);
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        letter-spacing: 0.04em;
      }
      .cp__libelle {
        color: var(--nf-text-primary);
      }
      .cp__badge {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .cp__badge--defaut {
        background: var(--nf-color-primary-50);
        color: var(--nf-color-primary-700);
        font-weight: 600;
      }
      .cp--empty {
        color: var(--nf-color-text-muted);
      }
    `,
  ],
})
export class ConditionPaiementDisplayComponent {
  readonly condition = input<ConditionPaiement | null | undefined>(null);

  readonly tooltip = computed(() => {
    const cp = this.condition();
    if (!cp) return '';
    const parts: string[] = [cp.libelle];
    if (cp.delaiJours != null) parts.push(`Délai ${cp.delaiJours}j`);
    if (cp.echeances?.length) {
      parts.push(`${cp.echeances.length} échéances`);
      cp.echeances.forEach((e) =>
        parts.push(`  • ${e.pourcentage}% à J+${e.delaiJours} (${e.description})`),
      );
    }
    return parts.join('\n');
  });
}
