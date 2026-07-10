import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { ButtonComponent } from '@lib/anatomy/components';

import type { PhaseChantierStatus } from '../../../../../chantiers/models';
import type { PlanningLegendItem } from '../../services/planning.facade';

@Component({
  selector: 'app-gantt-legend',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="gantt-legend">
      @for (item of items(); track item.status) {
        <nf-button
          variant="secondary"
          class="gantt-legend__chip"
          [class.gantt-legend__chip--inactive]="!item.active"
          [class.gantt-legend__chip--blue]="item.color === 'blue'"
          [class.gantt-legend__chip--green]="item.color === 'green'"
          [class.gantt-legend__chip--orange]="item.color === 'orange'"
          [class.gantt-legend__chip--gray]="item.color === 'gray'"
          (clicked)="toggle.emit(item.status)">
          <span class="gantt-legend__dot" aria-hidden="true"></span>
          <span class="gantt-legend__text">{{ item.label }}</span>
          <span class="gantt-legend__count">{{ item.count }}</span>
        </nf-button>
      }
    </div>
  `,
  styles: [
    `
      .gantt-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .gantt-legend__chip {
        --nf-button-content-gap: 0.4rem;
      }

      .gantt-legend__chip ::ng-deep button {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-height: auto;
        height: auto;
        padding: 0.65rem 0.9rem;
        border-radius: 999px;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .gantt-legend__chip:hover ::ng-deep button:not(:disabled) {
        transform: translateY(-1px);
      }

      .gantt-legend__chip--inactive ::ng-deep button {
        opacity: 0.45;
      }

      .gantt-legend__chip--blue ::ng-deep button { border-color: color-mix(in srgb, var(--nf-color-primary-500) 25%, transparent); }
      .gantt-legend__chip--green ::ng-deep button { border-color: color-mix(in srgb, var(--nf-color-success-600) 25%, transparent); }
      .gantt-legend__chip--orange ::ng-deep button { border-color: color-mix(in srgb, var(--nf-color-warning-600) 25%, transparent); }
      .gantt-legend__chip--gray ::ng-deep button { border-color: color-mix(in srgb, var(--nf-color-text-secondary) 25%, transparent); }

      .gantt-legend__dot {
        flex-shrink: 0;
        width: 0.7rem;
        height: 0.7rem;
        border-radius: 50%;
        background: currentColor;
      }

      .gantt-legend__text {
        font-weight: 500;
      }

      .gantt-legend__count {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .gantt-legend__chip--blue .gantt-legend__dot { color: var(--nf-color-primary-500); }
      .gantt-legend__chip--green .gantt-legend__dot { color: var(--nf-color-success-600); }
      .gantt-legend__chip--orange .gantt-legend__dot { color: var(--nf-color-warning-600); }
      .gantt-legend__chip--gray .gantt-legend__dot { color: var(--nf-color-text-secondary); }
    `,
  ],
})
export class GanttLegendComponent {
  readonly items = input.required<readonly PlanningLegendItem[]>();
  readonly toggle = output<PhaseChantierStatus>();
}