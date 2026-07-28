import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, NfSelectComponent, type NfSelectOption } from '@lib/anatomy/components';

import type { Chantier, PlanningDisplayMode, PlanningGranularity, PlanningPeriodPreset } from '@app/features/chantiers/models';

@Component({
  selector: 'app-gantt-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, NfSelectComponent, TranslateModule],
  template: `
    <div class="gantt-toolbar">
      <label class="gantt-toolbar__field gantt-toolbar__field--wide">
        <span>Filtre chantier</span>
        <!-- homog-exempt: multi-select until nf-select multi -->
        <select multiple [ngModel]="selectedChantierIds()" (ngModelChange)="selectedChantiersChange.emit($event ?? [])">
          @for (chantier of chantiers(); track chantier.id) {
            <option [value]="chantier.id">{{ chantier.code }} - {{ chantier.name }}</option>
          }
        </select>
      </label>

      <nf-select
        class="gantt-toolbar__field"
        [label]="'chantiers.planning.toolbar.periode' | translate"
        [options]="periodOptions()"
        [ngModel]="periodPreset()"
        (ngModelChange)="periodPresetChange.emit($event)"
      />

      <nf-select
        class="gantt-toolbar__field"
        [label]="'chantiers.planning.toolbar.granularite' | translate"
        [options]="granularityOptions()"
        [ngModel]="granularity()"
        (ngModelChange)="granularityChange.emit($event)"
      />

      <nf-select
        class="gantt-toolbar__field"
        label="Affichage"
        [options]="displayModeOptions"
        [ngModel]="displayMode()"
        (ngModelChange)="displayModeChange.emit($event)"
      />

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
  private readonly translate = inject(TranslateService);

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

  readonly periodOptions = computed<NfSelectOption[]>(() => [
    { value: 'THIS_MONTH', label: this.translate.instant('chantiers.planning.toolbar.ceMois') },
    { value: 'THIS_QUARTER', label: this.translate.instant('chantiers.planning.toolbar.ceTrimestre') },
    { value: 'THIS_YEAR', label: this.translate.instant('chantiers.planning.toolbar.cetteAnnee') },
    { value: 'ROLLING_6_MONTHS', label: '6 mois glissants' },
    { value: 'ALL', label: this.translate.instant('chantiers.planning.toolbar.tout') },
  ]);

  readonly granularityOptions = computed<NfSelectOption[]>(() => [
    { value: 'DAY', label: 'Jour' },
    { value: 'WEEK', label: 'Semaine' },
    { value: 'MONTH', label: 'Mois' },
    { value: 'QUARTER', label: 'Trimestre' },
  ]);

  readonly displayModeOptions: NfSelectOption[] = [
    { value: 'PHASES', label: 'Phases' },
    { value: 'LOTS', label: 'Lots' },
    { value: 'BOTH', label: 'Phases + Lots' },
  ];
}
