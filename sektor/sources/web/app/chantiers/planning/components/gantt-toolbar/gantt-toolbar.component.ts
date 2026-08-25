
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@platform/lib/anatomy/components';

import type { Chantier, PlanningGranularity, PlanningPeriodPreset } from '../../../models';

@Component({
  selector: 'app-gantt-toolbar',
  standalone: true,
  imports: [FormsModule, ButtonComponent, TranslateModule],
  template: `
    <div class="gantt-toolbar">
      <div class="gantt-toolbar__filters">
        <label class="gantt-toolbar__field gantt-toolbar__field--wide">
          <span>Chantier</span>
          <select
            aria-label="Chantier"
            [ngModel]="selectedChantierIds()[0] ?? ''"
            (ngModelChange)="selectedChantiersChange.emit($event ? [$event] : [])">
            <option value="">Tous les chantiers</option>
            @for (chantier of chantiers(); track chantier.id) {
              <option [value]="chantier.id">{{ chantier.code }} — {{ chantier.name }}</option>
            }
          </select>
        </label>

        <label class="gantt-toolbar__field">
          <span>{{ 'chantiers.planning.toolbar.periode' | translate }}</span>
          <select [ngModel]="periodPreset()" (ngModelChange)="periodPresetChange.emit($event)">
            <option value="THIS_MONTH">{{ 'chantiers.planning.toolbar.ceMois' | translate }}</option>
            <option value="THIS_QUARTER">{{ 'chantiers.planning.toolbar.ceTrimestre' | translate }}</option>
            <option value="THIS_YEAR">{{ 'chantiers.planning.toolbar.cetteAnnee' | translate }}</option>
            <option value="ROLLING_6_MONTHS">6 mois glissants</option>
            <option value="ALL">{{ 'chantiers.planning.toolbar.tout' | translate }}</option>
          </select>
        </label>

        <label class="gantt-toolbar__field">
          <span>{{ 'chantiers.planning.toolbar.granularite' | translate }}</span>
          <select [ngModel]="granularity()" (ngModelChange)="granularityChange.emit($event)">
            <option value="DAY">Jour</option>
            <option value="WEEK">Semaine</option>
            <option value="MONTH">Mois</option>
            <option value="QUARTER">Trimestre</option>
          </select>
        </label>
      </div>

      <div class="gantt-toolbar__actions">
        <nf-button
          variant="primary"
          icon="plus"
          data-testid="planning-new-activite"
          [disabled]="!canCreate()"
          (clicked)="newActiviteClick.emit()">
          {{ 'chantiers.planning.newActivite' | translate }}
        </nf-button>
        <nf-button variant="secondary" icon="calendar" (clicked)="todayClick.emit()">Aujourd'hui</nf-button>
        <nf-button variant="secondary" icon="download" (clicked)="exportClick.emit()">Exporter PDF</nf-button>
        <nf-button variant="secondary" icon="fullscreen" (clicked)="fullscreenClick.emit()">{{ 'chantiers.planning.toolbar.pleinEcran' | translate }}</nf-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .gantt-toolbar {
        display: flex;
        justify-content: space-between;
        gap: 1.25rem;
        align-items: end;
      }

      .gantt-toolbar__filters {
        display: grid;
        grid-template-columns: minmax(18rem, 1.8fr) repeat(2, minmax(9.5rem, 1fr));
        gap: 0.75rem;
        flex: 1 1 44rem;
        max-width: 56rem;
      }

      .gantt-toolbar__field {
        display: grid;
        gap: 0.35rem;
      }

      .gantt-toolbar__field span {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--nf-text-secondary);
      }

      .gantt-toolbar__field select {
        min-height: 2.85rem;
        border: 1px solid color-mix(in srgb, var(--nf-primary, var(--nf-color-primary-600)) 14%, var(--nf-color-border));
        border-radius: 0.75rem;
        background: var(--nf-color-surface);
        padding: 0.65rem 0.8rem;
        font: inherit;
        color: var(--nf-text-primary);
      }

      .gantt-toolbar__actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        flex-wrap: wrap;
        flex: 0 0 auto;
      }

      @media (max-width: 1450px) {
        .gantt-toolbar {
          align-items: stretch;
          flex-direction: column;
        }

        .gantt-toolbar__filters {
          flex: none;
          width: 100%;
          max-width: none;
        }

        .gantt-toolbar__actions {
          justify-content: flex-start;
          flex: none;
        }
      }

      @media (max-width: 720px) {
        .gantt-toolbar__filters {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class GanttToolbarComponent {
  readonly chantiers = input.required<readonly Chantier[]>();
  readonly selectedChantierIds = input.required<readonly string[]>();
  readonly granularity = input.required<PlanningGranularity>();
  readonly periodPreset = input.required<PlanningPeriodPreset>();
  readonly canCreate = input(false);

  readonly selectedChantiersChange = output<string[]>();
  readonly granularityChange = output<PlanningGranularity>();
  readonly periodPresetChange = output<PlanningPeriodPreset>();
  readonly todayClick = output<void>();
  readonly exportClick = output<void>();
  readonly fullscreenClick = output<void>();
  readonly newActiviteClick = output<void>();
}
