import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  LOCALE_ID,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { gantt, type GanttStatic } from 'dhtmlx-gantt';

import { BadgeComponent, ConfigDrivenDashboardPageImports, EmptyStateComponent, ConfirmDialogService, ToastService } from '@lib/anatomy';

import type { PlanningGranularity } from '../../../chantiers/models';
import { GanttLegendComponent } from './components/gantt-legend/gantt-legend.component';
import { GanttToolbarComponent } from './components/gantt-toolbar/gantt-toolbar.component';
import { PhaseDrawerComponent } from './components/phase-drawer/phase-drawer.component';
import { type PlanningDataset, type PlanningTask, PlanningFacade } from './services/planning.facade';

@Component({
  selector: 'app-chantiers-planning',
  standalone: true,
  imports: [
    CommonModule,
    ...ConfigDrivenDashboardPageImports,
    EmptyStateComponent,
    BadgeComponent,
    GanttToolbarComponent,
    GanttLegendComponent,
    PhaseDrawerComponent,
    TranslateModule,
  ],
  templateUrl: './chantiers-planning.page.html',
  styleUrl: './chantiers-planning.page.scss',
})
export class ChantiersPlanningPage {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly facade = inject(PlanningFacade);
  readonly ganttHost = viewChild<ElementRef<HTMLDivElement>>('ganttHost');
  readonly fullscreenHost = viewChild<ElementRef<HTMLDivElement>>('fullscreenHost');

  readonly headerConfig = computed(() => ({
    title: this.facade.summary().monoChantier
      ? `Planning ${this.facade.summary().monoChantier?.code}`
      : 'Planning chantiers',
    subtitle: this.facade.summary().monoChantier
      ? `${this.facade.summary().monoChantier?.name} · zoom mono-chantier`
      : 'Vue Gantt consolidée multi-chantiers avec dépendances et édition des dates',
    icon: 'event',
  }));

  readonly dataset = this.facade.ganttDataset;
  readonly summary = this.facade.summary;
  readonly hasData = computed(() => this.dataset().tasks.length > 0);

  private readonly ganttInstance: GanttStatic = gantt;
  private ganttInitialized = false;
  private ganttEventIds: string[] = [];
  private lastRangeKey = '';

  constructor() {
    effect(() => {
      const host = this.ganttHost()?.nativeElement;
      const dataset = this.dataset();
      const granularity = this.facade.granularity();
      const range = this.facade.effectiveRange();
      const rangeKey = `${range.start.toISOString()}-${range.end.toISOString()}-${granularity}-${dataset.tasks.length}`;

      if (!host) {
        return;
      }

      if (!dataset.tasks.length) {
        if (this.ganttInitialized) {
          this.ganttInstance.clearAll();
        }
        return;
      }

      queueMicrotask(() => {
        this.renderGantt(host, dataset, granularity, range.start, range.end);
        if (this.lastRangeKey !== rangeKey) {
          this.ganttInstance.showDate(new Date(Math.max(new Date().getTime(), range.start.getTime())));
          this.lastRangeKey = rangeKey;
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.ganttInitialized) {
        this.ganttInstance.clearAll();
        this.ganttEventIds.forEach((eventId) => this.ganttInstance.detachEvent(eventId));
      }
    });
  }

  onSelectChantiers(ids: string[]): void {
    this.facade.setSelectedChantiers(ids);
    this.facade.clearCustomRange();
  }

  onGranularityChange(value: PlanningGranularity): void {
    this.facade.setGranularity(value);
  }

  onExportPdf(): void {
    window.print();
  }

  onToday(): void {
    if (this.ganttInitialized) {
      this.ganttInstance.showDate(new Date());
    }
  }

  async onToggleFullscreen(): Promise<void> {
    const container = this.fullscreenHost()?.nativeElement;
    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  }

  onLegendToggle(status: PlanningTask['status']): void {
    this.facade.toggleLegend(status);
  }

  onOpenChantier(chantierId: string): void {
    void this.router.navigate(['/chantiers', chantierId]);
  }

  onEmptyStateAction(): void {
    const mono = this.summary().monoChantier;
    void this.router.navigate(mono ? ['/chantiers', mono.id] : ['/chantiers']);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.ganttInitialized) {
      this.ganttInstance.render();
    }
  }

  onGanttKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.facade.shiftRange(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.facade.shiftRange(1);
      return;
    }

    if (event.key === 'Enter' && this.facade.selectedTaskId()) {
      const taskId = this.facade.selectedTaskId();
      if (taskId && !this.facade.selectedPhaseDetail()) {
        const match = this.dataset().tasks.find((task) => task.id === taskId && task.recordType === 'PHASE');
        if (match) {
          this.facade.openPhase(taskId);
        }
      }
    }
  }

  private renderGantt(
    host: HTMLDivElement,
    dataset: PlanningDataset,
    granularity: PlanningGranularity,
    rangeStart: Date,
    rangeEnd: Date,
  ): void {
    this.configureGantt(granularity, rangeStart, rangeEnd);

    if (!this.ganttInitialized) {
      this.ganttInstance.init(host);
      this.attachGanttEvents();
      this.ganttInitialized = true;
    }

    this.ganttInstance.clearAll();
    this.ganttInstance.parse({ data: dataset.tasks, links: dataset.links });
    this.ganttInstance.render();
  }

  private configureGantt(granularity: PlanningGranularity, rangeStart: Date, rangeEnd: Date): void {
    const config = this.ganttInstance.config as Record<string, unknown>;
    const templates = this.ganttInstance.templates as Record<string, unknown>;

    this.ganttInstance.plugins({ marker: true, tooltip: true, keyboard_navigation: true });
    this.ganttInstance.config['date_format'] = '%Y-%m-%d';
    this.ganttInstance.config['drag_links'] = false;
    this.ganttInstance.config['drag_progress'] = false;
    this.ganttInstance.config['drag_resize'] = true;
    this.ganttInstance.config['drag_move'] = true;
    this.ganttInstance.config['grid_width'] = 360;
    this.ganttInstance.config['row_height'] = 48;
    this.ganttInstance.config['bar_height'] = 20;
    this.ganttInstance.config['show_progress'] = true;
    this.ganttInstance.config['open_tree_initially'] = true;
    this.ganttInstance.config.columns = [
      {
        name: 'text',
        label: 'Chantier / lot / phase',
        tree: true,
        width: 280,
        resize: true,
        template: (task: PlanningTask) => task.text,
      },
      {
        name: 'progress',
        label: 'Avanc.',
        width: 76,
        align: 'center',
        template: (task: PlanningTask) => `${Math.round((task.progress ?? 0) * 100)}%`,
      },
    ];

    this.configureScale(granularity);

    config['start_date'] = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() - 7);
    config['end_date'] = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate() + 7);

    this.ganttInstance.templates.task_class = (_start, _end, task: PlanningTask) =>
      `planning-task planning-task--${task.recordType.toLowerCase()} planning-task--${task.status.toLowerCase()}`;
    this.ganttInstance.templates.grid_row_class = (_start, _end, task: PlanningTask) => `planning-row planning-row--${task.recordType.toLowerCase()}`;
    this.ganttInstance.templates.task_text = (_start, _end, task: PlanningTask) =>
      task.recordType === 'PHASE' ? `${Math.round(task.progress * 100)}%` : '';
    this.ganttInstance.templates.tooltip_text = (_start, _end, task: PlanningTask) =>
      `<div class="planning-tooltip"><strong>${task.text}</strong><br/>${this.formatUiDate(task.start_date)} → ${this.formatUiDate(new Date(task.end_date.getTime() - 86400000))}<br/>Avancement: ${Math.round(task.progress * 100)}%</div>`;

    const markerStore = this.ganttInstance as unknown as Record<string, string | number | undefined>;
    if (markerStore['_nafuraTodayMarker']) {
      this.ganttInstance.deleteMarker(markerStore['_nafuraTodayMarker']);
    }
    markerStore['_nafuraTodayMarker'] = this.ganttInstance.addMarker({
      start_date: new Date(),
      css: 'planning-today-marker',
      text: "Aujourd'hui",
      title: `Aujourd'hui · ${this.formatUiDate(new Date())}`,
    });
  }

  private configureScale(granularity: PlanningGranularity): void {
    const config = this.ganttInstance.config as Record<string, unknown>;
    const templates = this.ganttInstance.templates as Record<string, unknown>;

    templates['scale_cell_class'] = null;
    templates['date_scale'] = null;

    switch (granularity) {
      case 'DAY':
        config['scale_unit'] = 'day';
        config['step'] = 1;
        config['date_scale'] = '%d %M';
        config['subscales'] = [];
        config['min_column_width'] = 60;
        break;
      case 'MONTH':
        config['scale_unit'] = 'month';
        config['step'] = 1;
        config['date_scale'] = '%F %Y';
        config['subscales'] = [{ unit: 'week', step: 1, date: 'S%W' }];
        config['min_column_width'] = 120;
        break;
      case 'QUARTER':
        config['scale_unit'] = 'month';
        config['step'] = 3;
        config['date_scale'] = '%m';
        config['subscales'] = [{ unit: 'month', step: 1, date: '%M' }];
        config['min_column_width'] = 140;
        templates['scale_cell_class'] = (date: Date) => `planning-scale-quarter planning-scale-quarter--q${Math.floor(date.getMonth() / 3) + 1}`;
        templates['date_scale'] = (date: Date) => `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        break;
      case 'WEEK':
      default:
        config['scale_unit'] = 'week';
        config['step'] = 1;
        config['date_scale'] = 'Semaine %W';
        config['subscales'] = [{ unit: 'day', step: 1, date: '%d %M' }];
        config['min_column_width'] = 80;
        break;
    }
  }

  private attachGanttEvents(): void {
    this.ganttEventIds.push(
      this.ganttInstance.attachEvent('onTaskClick', (id: string | number) => {
        const task = this.ganttInstance.getTask(id) as PlanningTask;
        this.facade.setSelectedTask(String(id));
        if (task.recordType === 'CHANTIER') {
          this.onOpenChantier(task.chantierId);
          return false;
        }
        if (task.recordType === 'PHASE') {
          this.facade.openPhase(String(id));
        }
        return true;
      }),
    );

    this.ganttEventIds.push(
      this.ganttInstance.attachEvent('onTaskSelected', (id: string | number) => {
        this.facade.setSelectedTask(String(id));
        return true;
      }),
    );

    this.ganttEventIds.push(
      this.ganttInstance.attachEvent('onAfterTaskDrag', (id: string | number) => {
        const task = this.ganttInstance.getTask(id) as PlanningTask;
        if (task.recordType !== 'PHASE') {
          return true;
        }
        void this.handlePhaseDrag(String(id), task);
        return true;
      }),
    );
  }

  private async handlePhaseDrag(id: string, task: PlanningTask): Promise<void> {
    const endDate = new Date(task.end_date.getTime() - 86400000);
    const confirmed = await this.confirmDialog.confirm({
      title: 'Confirmer le décalage',
      message: `Confirmer le décalage de ${task.text} vers ${this.formatUiDate(task.start_date)} → ${this.formatUiDate(endDate)} ?`,
      confirmLabel: 'OK',
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!confirmed) {
      this.revertGanttRender();
      return;
    }

    const res = this.facade.updatePhaseDates(id, task.start_date, endDate);
    if (!res.ok) {
      this.toast.error(res.message ?? 'Replanification refusée pour motif médical / HSE.');
      this.revertGanttRender();
    }
  }

  private revertGanttRender(): void {
    const host = this.ganttHost()?.nativeElement;
    if (host) {
      this.renderGantt(host, this.dataset(), this.facade.granularity(), this.facade.effectiveRange().start, this.facade.effectiveRange().end);
    }
  }

  private formatUiDate(value: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(value);
  }
}