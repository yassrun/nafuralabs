
import { Component, computed, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy/components';

import type { Chantier, PlanningGranularity, PlanningPeriodPreset } from '../../../models';

@Component({
  selector: 'app-gantt-toolbar',
  standalone: true,
  imports: [FormsModule, ButtonComponent, NfSelectComponent, TranslateModule],
  template: `
    <div class="gantt-toolbar">
      <div class="gantt-toolbar__filters">
        <label class="gantt-toolbar__field gantt-toolbar__field--wide">
          <span>Chantier</span>
          <nf-select
            aria-label="Chantier"
            [options]="chantierOptions()"
            [ngModel]="selectedChantierIds()[0] ?? ''"
            (ngModelChange)="selectedChantiersChange.emit($event ? [$event] : [])"
            [placeholder]="'Tous les chantiers'"
          />
        </label>

        <label class="gantt-toolbar__field">
          <span>{{ 'chantiers.planning.toolbar.periode' | translate }}</span>
          <nf-select
            [options]="periodOptions()"
            [ngModel]="periodPreset()"
            (ngModelChange)="periodPresetChange.emit($event)"
          />
        </label>

        <label class="gantt-toolbar__field">
          <span>{{ 'chantiers.planning.toolbar.granularite' | translate }}</span>
          <nf-select
            [options]="granularityOptions()"
            [ngModel]="granularity()"
            (ngModelChange)="granularityChange.emit($event)"
          />
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly translate = inject(TranslateService);

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

  readonly chantierOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: 'Tous les chantiers' },
    ...this.chantiers().map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  ]);

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
}
