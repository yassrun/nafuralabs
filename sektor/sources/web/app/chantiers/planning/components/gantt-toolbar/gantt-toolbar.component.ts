
import { Component, computed, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActionBarComponent, ButtonComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy/components';

import type { Chantier, PlanningGranularity, PlanningPeriodPreset } from '../../../models';
import type { PlanningCapacites } from '../../../services/activite-api.service';
import { PLANNING_NATURES } from '../../services/planning-natures';
import type { PlanningSavedView } from '../../services/planning.facade';

@Component({
  selector: 'app-gantt-toolbar', standalone: true,
  imports: [MatMenuModule, FormsModule, ActionBarComponent, ButtonComponent, NfSelectComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <nf-action-bar class="toolbar__main" align="left" spacing="sm">
        <select aria-label="Période" [ngModel]="periodPreset()" (ngModelChange)="periodPresetChange.emit($event)">
          @for(option of periodOptions(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }
        </select>
        <select aria-label="Échelle du planning" [ngModel]="granularity()" (ngModelChange)="granularityChange.emit($event)">
          @for(option of granularityOptions(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }
        </select>
        <nf-button variant="tertiary" (clicked)="todayClick.emit()">Aujourd&#8217;hui</nf-button>
        <ng-content></ng-content>
        <nf-button variant="secondary" [disabled]="!canCalendar() || simulating()" (clicked)="simulateClick.emit()">{{ simulating() ? 'Calcul…' : 'Simuler' }}</nf-button>
        <nf-button variant="tertiary" [matMenuTriggerFor]="actionsMenu" aria-label="Actions du planning">Actions</nf-button>
        <mat-menu #actionsMenu="matMenu">
          <button mat-menu-item [disabled]="!canCalendar()" (click)="calendarClick.emit()">Calendrier du chantier</button>
          @if(capacites().gererVues) { <button mat-menu-item (click)="viewFormOpen.set(true); openSettings()">Enregistrer la vue</button> }
          <button mat-menu-item (click)="exportClick.emit()">Exporter PDF</button>
          <button mat-menu-item (click)="fullscreenClick.emit()">Plein écran</button>
        </mat-menu>
        <nf-button variant="primary" icon="plus" [disabled]="!canCreate()" [matMenuTriggerFor]="addMenu">Ajouter</nf-button>
        <mat-menu #addMenu="matMenu">
          <button mat-menu-item (click)="newActiviteClick.emit()">Activité</button>
          <button mat-menu-item (click)="newJalonClick.emit()">Jalon</button>
          <button mat-menu-item (click)="newPhaseClick.emit()">Phase</button>
        </mat-menu>
      </nf-action-bar>
      @if(settingsOpen() || !selectedChantierIds().length) {
        <div class="toolbar__settings">
          <label>Changer de chantier <nf-select aria-label="Chantier" [options]="chantierOptions()" [ngModel]="selectedChantierIds()[0] || ''" (ngModelChange)="selectedChantiersChange.emit($event ? [$event] : [])" /></label>
          <label>Nature <nf-select [options]="natureOptions()" [ngModel]="natureFilter()" (ngModelChange)="natureFilterChange.emit($event)" /></label>
          @if(savedViews().length) {
            <label>Vue enregistrée <nf-select [options]="viewOptions()" [ngModel]="''" (ngModelChange)="onApplyView($event)" /></label>
          }
          @if(viewFormOpen()) {
            <form (submit)="$event.preventDefault(); onSaveView()">
              <label>Nom de la vue <input name="viewName" [ngModel]="viewNameDraft()" (ngModelChange)="viewNameDraft.set($event)" required maxlength="80" /></label>
              <button type="submit" [disabled]="!viewNameDraft().trim()">Enregistrer</button>
              <button type="button" (click)="viewFormOpen.set(false)">Annuler</button>
            </form>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {display:block;min-width:0;}
    .toolbar__main {display:block;min-width:0;max-width:100%;}
    button:not([mat-menu-item]),select,input {font:inherit;font-size:.84rem;border:1px solid var(--nf-color-border,#dbe1eb);border-radius:.5rem;background:var(--nf-color-surface,#fff);color:inherit;padding:.55rem .7rem;min-height:36px;}
    button {cursor:pointer;} button:disabled {opacity:.45;cursor:default;} button:focus-visible,select:focus-visible {outline:2px solid #3159d6;outline-offset:2px;}
    button.quiet {border-color:transparent;background:transparent;color:#526078;} button.quiet:hover,button.selected {background:#eef2fc;}
    button.primary {background:#213daf;border-color:#213daf;color:white;font-weight:600;}
    .spacer {flex:1;} .add {position:relative;} .add__choices {position:absolute;right:0;top:calc(100% + 6px);z-index:20;min-width:170px;padding:.35rem;background:white;border:1px solid #dbe1eb;border-radius:.6rem;box-shadow:0 8px 24px #17254b22;display:grid;}
    .add__choices button {text-align:left;border:0;} .add__choices button:hover {background:#eef2fc;}
    .toolbar__settings {display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.85rem;background:#f6f8fc;padding:1rem;margin-top:.6rem;border-radius:.7rem;}
    label {display:grid;gap:.35rem;font-size:.75rem;color:#526078;min-width:0;}
    .toolbar__tools,form {grid-column:1/-1;display:flex;gap:.5rem;align-items:end;flex-wrap:wrap;}
    @media(max-width:600px) {.toolbar__main {gap:.25rem;} button,select {padding:.45rem .5rem;} .spacer {display:none;} }
  `],
})
export class GanttToolbarComponent {
  openSettings(): void { if (!this.settingsOpen()) this.settingsToggle.emit(); }
  readonly simulating = input(false);
  readonly simulateClick = output<void>();
  readonly settingsOpen = input(false);
  readonly settingsToggle = output<void>();
  readonly addOpen = signal(false);
  private readonly translate = inject(TranslateService);
  readonly viewNameDraft = signal('');
  readonly viewFormOpen = signal(false);

  readonly chantiers = input.required<readonly Chantier[]>();
  readonly selectedChantierIds = input.required<readonly string[]>();
  readonly granularity = input.required<PlanningGranularity>();
  readonly periodPreset = input.required<PlanningPeriodPreset>();
  readonly natureFilter = input('');
  readonly canCreate = input(false);
  readonly canCalendar = input(false);
  readonly capacites = input<PlanningCapacites>({
    lire: true,
    editerStructure: false,
    proposerStructure: false,
    administrerCalendrier: false,
    proposerCalendrier: false,
    gererVues: false,
  });
  readonly savedViews = input<readonly PlanningSavedView[]>([]);

  readonly selectedChantiersChange = output<string[]>();
  readonly granularityChange = output<PlanningGranularity>();
  readonly periodPresetChange = output<PlanningPeriodPreset>();
  readonly natureFilterChange = output<string>();
  readonly todayClick = output<void>();
  readonly exportClick = output<void>();
  readonly fullscreenClick = output<void>();
  readonly newActiviteClick = output<void>();
  readonly newJalonClick = output<void>();
  readonly newPhaseClick = output<void>();
  readonly calendarClick = output<void>();
  readonly saveView = output<string>();
  readonly applyView = output<string>();

  readonly chantierOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: this.translate.instant('chantiers.planning.toolbar.tousChantiers') },
    ...this.chantiers().map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  ]);

  readonly periodOptions = computed<NfSelectOption[]>(() => [
    { value: 'THIS_MONTH', label: this.translate.instant('chantiers.planning.toolbar.ceMois') },
    { value: 'THIS_QUARTER', label: this.translate.instant('chantiers.planning.toolbar.ceTrimestre') },
    { value: 'THIS_YEAR', label: this.translate.instant('chantiers.planning.toolbar.cetteAnnee') },
    { value: 'ROLLING_6_MONTHS', label: this.translate.instant('chantiers.planning.toolbar.glissant') },
    { value: 'ALL', label: this.translate.instant('chantiers.planning.toolbar.tout') },
  ]);

  readonly granularityOptions = computed<NfSelectOption[]>(() => [
    { value: 'DAY', label: this.translate.instant('chantiers.planning.toolbar.jour') },
    { value: 'WEEK', label: this.translate.instant('chantiers.planning.toolbar.semaine') },
    { value: 'MONTH', label: this.translate.instant('chantiers.planning.toolbar.mois') },
    { value: 'QUARTER', label: this.translate.instant('chantiers.planning.toolbar.trimestre') },
  ]);

  readonly natureOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: this.translate.instant('chantiers.planning.toolbar.toutesNatures') },
    ...PLANNING_NATURES.map((n) => ({ value: n.code, label: this.translate.instant(n.labelKey) })),
  ]);

  readonly viewOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: this.translate.instant('chantiers.planning.views.apply') },
    ...this.savedViews().map((v) => ({ value: v.id, label: v.name })),
  ]);

  onSaveView(): void {
    const name = this.viewNameDraft().trim();
    if (name) { this.saveView.emit(name); this.viewFormOpen.set(false); }
  }

  onApplyView(id: string): void {
    if (id) {
      this.applyView.emit(id);
    }
  }
}
