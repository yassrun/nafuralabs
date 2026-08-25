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
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { gantt, type GanttStatic } from 'dhtmlx-gantt';

import { BadgeComponent, ConfigDrivenDashboardPageImports, EmptyStateComponent, ConfirmDialogService, ToastService } from '@platform/lib/anatomy';

import type { PlanningGranularity } from '../models';
import { GanttLegendComponent } from './components/gantt-legend/gantt-legend.component';
import { GanttToolbarComponent } from './components/gantt-toolbar/gantt-toolbar.component';
import { ActiviteDrawerComponent } from './components/activite-drawer/activite-drawer.component';
import { type PlanningDataset, type PlanningTask, PlanningFacade } from './services/planning.facade';

@Component({
  selector: 'app-chantiers-planning',
  standalone: true,
  imports: [
    ...ConfigDrivenDashboardPageImports,
    EmptyStateComponent,
    BadgeComponent,
    GanttToolbarComponent,
    GanttLegendComponent,
    ActiviteDrawerComponent,
    TranslateModule
],
  templateUrl: './chantiers-planning.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './chantiers-planning.page.scss',
})
export class ChantiersPlanningPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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
      ? `${this.facade.summary().monoChantier?.name} · activités du chantier`
      : 'Gantt des activités — lots hors calendrier',
    icon: 'event',
  }));

  readonly dataset = this.facade.ganttDataset;
  readonly summary = this.facade.summary;
  readonly hasData = computed(() => this.dataset().tasks.length > 0);

  private readonly ganttInstance: GanttStatic = gantt;
  private ganttInitialized = false;
  private ganttEventIds: string[] = [];

  constructor() {
    const chantierFilter = this.route.snapshot.queryParamMap.get('chantier');
    if (chantierFilter) {
      this.facade.setSelectedChantiers([chantierFilter]);
    }

    effect(() => {
      const host = this.ganttHost()?.nativeElement;
      const dataset = this.dataset();
      const granularity = this.facade.granularity();
      const range = this.facade.effectiveRange();
      if (!host) {
        return;
      }

      if (!dataset.tasks.length) {
        if (this.ganttInitialized) {
          this.ganttInstance.clearAll();
        }
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.renderGantt(host, dataset, granularity, range.start, range.end);
        });
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
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chantier: ids[0] ?? null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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

  async onNewActivite(): Promise<void> {
    const res = await this.facade.openCreate();
    if (!res.ok) {
      this.toast.error(res.message ?? this.translate.instant('chantiers.planning.filterRequired'));
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.ganttInitialized) {
      this.ganttInstance.setSizes();
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
      if (taskId && !this.facade.drawerOpen()) {
        const match = this.dataset().tasks.find((task) => task.id === taskId && task.recordType === 'ACTIVITE');
        if (match) {
          void this.facade.openActivite(taskId);
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

    host.style.width = '100%';
    const ganttHeight = Math.min(680, Math.max(360, 116 + dataset.tasks.length * 48));
    host.style.height = `${ganttHeight}px`;
    host.style.minHeight = '360px';

    if (!this.ganttInitialized) {
      this.ganttInstance.init(host);
      this.attachGanttEvents();
      this.ganttInitialized = true;
    }

    this.ganttInstance.clearAll();
    this.ganttInstance.parse({ data: dataset.tasks, links: dataset.links });
    this.ganttInstance.setSizes();
    this.ganttInstance.render();
    const firstActivityDate = dataset.tasks.reduce(
      (earliest, task) => task.start_date < earliest ? task.start_date : earliest,
      dataset.tasks[0]?.start_date ?? rangeStart,
    );
    this.ganttInstance.showDate(firstActivityDate);
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
    this.ganttInstance.config['grid_width'] = 488;
    this.ganttInstance.config['row_height'] = 48;
    this.ganttInstance.config['bar_height'] = 20;
    this.ganttInstance.config['show_progress'] = true;
    this.ganttInstance.config['open_tree_initially'] = true;
    this.ganttInstance.config.columns = [
      {
        name: 'text',
        label: 'Activité',
        tree: true,
        width: 220,
        resize: true,
        template: (task: PlanningTask) => task.text,
      },
      {
        name: 'start_date',
        label: 'Début',
        width: 88,
        align: 'center',
        template: (task: PlanningTask) => this.formatGridDate(task.start_date),
      },
      {
        name: 'end_date',
        label: 'Fin',
        width: 88,
        align: 'center',
        template: (task: PlanningTask) => this.formatGridDate(new Date(task.end_date.getTime() - 86400000)),
      },
      {
        name: 'progress',
        label: 'Avanc.',
        width: 88,
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
      task.recordType === 'ACTIVITE' ? `${Math.round(task.progress * 100)}%` : '';
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
        config['scales'] = [{ unit: 'day', step: 1, format: '%d %M' }];
        config['min_column_width'] = 60;
        break;
      case 'MONTH':
        config['scales'] = [
          { unit: 'month', step: 1, format: '%F %Y' },
          { unit: 'week', step: 1, format: 'S%W' },
        ];
        config['min_column_width'] = 120;
        break;
      case 'QUARTER':
        config['scales'] = [
          {
            unit: 'quarter',
            step: 1,
            format: (date: Date) => `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
          },
          { unit: 'month', step: 1, format: '%M' },
        ];
        config['min_column_width'] = 140;
        break;
      case 'WEEK':
      default:
        config['scales'] = [{ unit: 'week', step: 1, format: 'Sem. %W' }];
        config['min_column_width'] = 104;
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
        if (task.recordType === 'ACTIVITE') {
          void this.facade.openActivite(String(id));
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
        if (task.recordType !== 'ACTIVITE') {
          return true;
        }
        void this.handleActiviteDrag(String(id), task);
        return true;
      }),
    );
  }

  private async handleActiviteDrag(id: string, task: PlanningTask): Promise<void> {
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

    const res = await this.facade.updateActiviteDates(id, task.start_date, endDate);
    if (!res.ok) {
      this.toast.error(res.message ?? 'Replanification refusée.');
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

  private formatGridDate(value: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: 'short',
    }).format(value);
  }
}
