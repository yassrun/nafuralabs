import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy/components';

import type { Chantier, PlanningDisplayMode, PlanningGranularity, PlanningPeriodPreset } from '../../../../../chantiers/models';

@Component({
  selector: 'app-gantt-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, TranslateModule],
  template: `
    <div class="gantt-toolbar">
      <label class="gantt-toolbar__field gantt-toolbar__field--wide">
        <span>Filtre chantier</span>
        <select multiple [ngModel]="selectedChantierIds()" (ngModelChange)="selectedChantiersChange.emit($event ?? [])">
          @for (chantier of chantiers(); track chantier.id) {
            <option [value]="chantier.id">{{ chantier.code }} - {{ chantier.name }}</option>
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

      <label class="gantt-toolbar__field">
        <span>Affichage</span>
        <select [ngModel]="displayMode()" (ngModelChange)="displayModeChange.emit($event)">
          <option value="PHASES">Phases</option>
          <option value="LOTS">Lots</option>
          <option value="BOTH">Phases + Lots</option>
        </select>
      </label>

      <div class="gantt-toolbar__actions">
        <nf-button variant="secondary" icon="calendar" (clicked)="todayClick.emit()">Aujourd'hui</nf-button>
        <nf-button variant="secondary" icon="download" (clicked)="exportClick.emit()">Exporter PDF</nf-button>
        <nf-button variant="primary" icon="fullscreen" (clicked)="fullscreenClick.emit()">{{ 'chantiers.planning.toolbar.pleinEcran' | translate }}</nf-button>
      </div>
    </div>
  `,
  styles: [
    `
      .gantt-toolbar {
        display: grid;
        grid-template-columns: minmax(16rem, 2fr) repeat(3, minmax(10rem, 1fr)) auto;
        gap: 0.9rem;
        align-items: end;
      }

      .gantt-toolbar__field {
        display: grid;
        gap: 0.35rem;
      }

      .gantt-toolbar__field span {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--nf-text-secondary);
      }

      .gantt-toolbar__field select {
        min-height: 2.85rem;
        border: 1px solid color-mix(in srgb, var(--nf-primary, var(--nf-color-primary-600)) 14%, var(--nf-color-border));
        border-radius: 0.9rem;
        background: var(--nf-color-surface);
        padding: 0.7rem 0.9rem;
        font: inherit;
        color: var(--nf-text-primary);
      }

      .gantt-toolbar__field--wide select {
        min-height: 6.5rem;
      }

      .gantt-toolbar__actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      @media (max-width: 1200px) {
        .gantt-toolbar {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .gantt-toolbar__actions {
          grid-column: 1 / -1;
          justify-content: flex-start;
        }
      }

      @media (max-width: 720px) {
        .gantt-toolbar {
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
  readonly displayMode = input.required<PlanningDisplayMode>();
  readonly periodPreset = input.required<PlanningPeriodPreset>();

  readonly selectedChantiersChange = output<string[]>();
  readonly granularityChange = output<PlanningGranularity>();
  readonly displayModeChange = output<PlanningDisplayMode>();
  readonly periodPresetChange = output<PlanningPeriodPreset>();
  readonly todayClick = output<void>();
  readonly exportClick = output<void>();
  readonly fullscreenClick = output<void>();
}