import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatCardComponent } from '../stat-card';
import type { KpiItem } from '../../../types';

/**
 * KPI Strip Component
 *
 * Horizontal grid of stat cards with optional secondary text.
 */
@Component({
  selector: 'nf-kpi-strip',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="nf-kpi-strip">
      @for (kpi of kpis(); track kpi.id) {
        <button
          type="button"
          class="nf-kpi-strip__card"
          [title]="kpi.secondary?.tooltip || ''"
          (click)="onKpiClick(kpi)">
          <nf-stat-card
            [label]="kpi.label"
            [value]="kpi.value"
            [icon]="kpi.icon"
            variant="default">
          </nf-stat-card>
          @if (kpi.secondary) {
            <div class="nf-kpi-strip__secondary">
              {{ kpi.secondary.label }}
            </div>
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .nf-kpi-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--nf-space-3, 12px);
      }

      .nf-kpi-strip__card {
        background: var(--nf-color-surface, #fff);
        border: 1px solid var(--nf-color-border, #e0e0e0);
        border-radius: var(--nf-radius-md, 8px);
        padding: 0;
        text-align: left;
        cursor: pointer;
        position: relative;
        display: flex;
        flex-direction: column;
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }

      .nf-kpi-strip__card:hover {
        transform: translateY(-2px);
        box-shadow: var(--nf-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
      }

      .nf-kpi-strip__card ::ng-deep nf-stat-card .nf-stat-card {
        border: none;
        background: transparent;
        padding-bottom: var(--nf-space-2, 8px);
      }

      .nf-kpi-strip__secondary {
        font-size: 0.75rem;
        color: var(--nf-text-secondary, #666);
        padding: 0 var(--nf-space-4, 16px) var(--nf-space-4, 16px) 64px;
        margin-top: 0;
      }

      .nf-kpi-strip__card:focus-visible {
        outline: 2px solid var(--nf-border-focus);
        outline-offset: 2px;
        border-radius: var(--nf-radius-md, 8px);
      }
    `,
  ],
})
export class KpiStripComponent {
  kpis = input<KpiItem[]>([]);
  kpiClick = output<KpiItem>();

  onKpiClick(kpi: KpiItem): void {
    this.kpiClick.emit(kpi);
  }
}
