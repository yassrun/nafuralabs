import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  LOCALE_ID,
  computed,
  signal,
  effect,
  inject,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { gantt, type GanttStatic } from 'dhtmlx-gantt';

import {
  AlertComponent,
  ListingControlsComponent,
  type ListingControlsColumn,
  ButtonComponent,
  ConfigDrivenDashboardPageImports,
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
  ToastService,
} from '@platform/lib/anatomy';

import type { ActiviteForme } from '../services/activite-api.service';
import type { PlanningGranularity } from '../models';
import { GanttLegendComponent } from './components/gantt-legend/gantt-legend.component';
import { GanttToolbarComponent } from './components/gantt-toolbar/gantt-toolbar.component';
import { ActiviteDrawerComponent } from './components/activite-drawer/activite-drawer.component';
import { PlanningBusinessViewsComponent } from './components/planning-business-views.component';
import { CalendrierDrawerComponent } from './components/calendrier-drawer/calendrier-drawer.component';
import { type PlanningDataset, type PlanningTask, PlanningFacade } from './services/planning.facade';

@Component({
  selector: 'app-chantiers-planning',
  standalone: true,
  imports: [
    ...ConfigDrivenDashboardPageImports,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    AlertComponent,
    ListingControlsComponent,
    ButtonComponent,
    GanttToolbarComponent,
    GanttLegendComponent,
    ActiviteDrawerComponent,
    CalendrierDrawerComponent,
    PlanningBusinessViewsComponent,
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

  readonly activeView = signal<'EXECUTION'|'CLIENT'|'FINANCIER'|'RESSOURCES'>('EXECUTION');
  readonly businessView = computed(() => { const view=this.activeView(); return view==='EXECUTION'?'CLIENT':view; });
  readonly planningViews = [{id:'EXECUTION' as const,label:'Exécution'}, {id:'CLIENT' as const,label:'Client'}, {id:'FINANCIER' as const,label:'Financier'}, {id:'RESSOURCES' as const,label:'Ressources'}];
  readonly displayOpen = signal(false);
  private readonly treeExpansion = new Map<string, boolean>();
  setTreeExpanded(expanded: boolean): void {
    if (!this.ganttInitialized) return;
    this.ganttInstance.batchUpdate(() => {
      this.ganttInstance.eachTask(task => {
        this.treeExpansion.set(String(task.id), expanded);
        if (expanded) this.ganttInstance.open(task.id); else this.ganttInstance.close(task.id);
      });
    });
  }
  readonly showLinks = this.facade.showLinks;
  readonly displayColumns = [
    { id: 'forme', label: 'Type de ligne' }, { id: 'start_date', label: 'Début' },
    { id: 'end_date', label: 'Fin' }, { id: 'duree', label: 'Durée' },
    { id: 'predecessors', label: 'Prédécesseurs' },
  ];
  readonly listingColumns = computed<ListingControlsColumn[]>(() => this.displayColumns.map(column => ({
    key: column.id, label: column.label, visible: this.facade.visibleColumns().includes(column.id),
  })));
  readonly hiddenColumnCount = computed(() => this.listingColumns().filter(column => !column.visible).length);
  onColumnsChange(columns: ListingControlsColumn[]): void {
    this.facade.visibleColumns.set(['text', ...columns.filter(column => column.visible).map(column => column.key)]);
  }
  toggleColumn(id: string): void {
    this.facade.visibleColumns.update(columns => columns.includes(id) ? columns.filter(c => c !== id) : [...columns, id]);
  }
  readonly dataset = this.facade.ganttDataset;
  readonly summary = this.facade.summary;
  readonly pageState = this.facade.pageState;
  readonly canCreate = computed(
    () =>
      !!this.summary().monoChantier &&
      (this.facade.capacites().editerStructure || this.facade.capacites().proposerStructure),
  );

  private readonly ganttInstance: GanttStatic = gantt;
  private ganttInitialized = false;
  private ganttPluginsReady = false;
  private boundGanttHost: HTMLDivElement | null = null;
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
      this.facade.visibleColumns();
      this.showLinks();
      this.facade.simulation();
      this.facade.showCritical();
      this.pageState();
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
      this.ganttEventIds.forEach((eventId) => this.ganttInstance.detachEvent(eventId));
      this.ganttEventIds = [];
      if (this.ganttInitialized) {
        this.ganttInstance.clearAll();
      }
      this.ganttInitialized = false;
      this.boundGanttHost = null;
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

  async onNewLigne(forme: ActiviteForme): Promise<void> {
    const res = await this.facade.openCreate(forme);
    if (!res.ok) {
      this.toast.error(res.message ?? this.translate.instant('chantiers.planning.filterRequired'));
    }
  }

  onSaveView(name: string): void {
    const res = this.facade.saveCurrentView(name);
    if (!res.ok) {
      this.toast.error(res.message ?? name);
      return;
    }
    this.toast.success(this.translate.instant('chantiers.planning.views.saved'));
  }

  onApplyView(id: string): void {
    this.facade.applyView(id);
    const chantierId = this.facade.selectedChantierIds()[0] ?? null;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chantier: chantierId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onOpenChantiers(): void {
    void this.router.navigate(['/chantiers']);
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
    this.configureGantt(granularity, rangeStart, rangeEnd, host.clientWidth);

    host.style.width = '100%';
    const ganttHeight = Math.min(680, Math.max(360, 116 + dataset.tasks.length * 48));
    host.style.height = `${ganttHeight}px`;
    host.style.minHeight = '360px';

    this.bindGanttHost(host);

    this.ganttInstance.clearAll();
    this.ganttInstance.parse({ data: dataset.tasks.map(task => ({ ...task, open: this.treeExpansion.get(String(task.id)) ?? task.open })), links: dataset.links });
    this.updateTodayMarker();
    this.ganttInstance.setSizes();
    this.ganttInstance.render();
    const dated = dataset.tasks.filter((task) => !Number.isNaN(task.start_date?.getTime?.() ?? Number.NaN));
    const firstActivityDate = dated.reduce(
      (earliest, task) => (task.start_date < earliest ? task.start_date : earliest),
      dated[0]?.start_date ?? rangeStart,
    );
    if (!Number.isNaN(firstActivityDate.getTime())) {
      this.ganttInstance.showDate(firstActivityDate);
    }
  }

  private bindGanttHost(host: HTMLDivElement): void {
    if (!this.ganttPluginsReady) {
      this.ganttInstance.plugins({ marker: true, tooltip: true, keyboard_navigation: true });
      this.ganttPluginsReady = true;
    }
    if (this.ganttInitialized && this.boundGanttHost === host) {
      return;
    }
    this.ganttEventIds.forEach((eventId) => this.ganttInstance.detachEvent(eventId));
    this.ganttEventIds = [];
    this.ganttInstance.init(host);
    this.attachGanttEvents();
    this.ganttInitialized = true;
    this.boundGanttHost = host;
  }

  private configureGantt(
    granularity: PlanningGranularity,
    rangeStart: Date,
    rangeEnd: Date,
    hostWidth = 0,
  ): void {
    const config = this.ganttInstance.config as Record<string, unknown>;
    const templates = this.ganttInstance.templates as Record<string, unknown>;

    this.ganttInstance.config['date_format'] = '%Y-%m-%d';
    this.ganttInstance.config['drag_links'] = false;
    this.ganttInstance.config['show_links'] = this.showLinks();
    this.ganttInstance.config['drag_progress'] = false;
    this.ganttInstance.config['drag_resize'] = false;
    this.ganttInstance.config['drag_move'] = false;
    const width = hostWidth > 0 ? hostWidth : 960;
    this.ganttInstance.config['grid_width'] = Math.min(560, Math.max(280, Math.floor(width * 0.52)));
    this.ganttInstance.config.layout = {
      css: 'gantt_container', cols: [
        { width: Math.min(560, Math.max(280, Math.floor(width * 0.52))), rows: [
          { view: 'grid', scrollX: 'gridScroll', scrollY: 'scrollVer', scrollable: true },
          { view: 'scrollbar', id: 'gridScroll', group: 'horizontal' },
        ] },
        { resizer: true, width: 1 },
        { rows: [
          { view: 'timeline', scrollX: 'scrollHor', scrollY: 'scrollVer' },
          { view: 'scrollbar', id: 'scrollHor', group: 'horizontal' },
        ] },
        { view: 'scrollbar', id: 'scrollVer' },
      ],
    };
    this.ganttInstance.config['row_height'] = 48;
    this.ganttInstance.config['bar_height'] = 20;
    this.ganttInstance.config['show_progress'] = true;
    this.ganttInstance.config['open_tree_initially'] = true;
    const visible = new Set(this.facade.visibleColumns());
    const columns: Record<string, unknown>[] = [
      {
        name: 'text',
        label: this.translate.instant('chantiers.planning.grid.activite'),
        tree: true,
        width: 168,
        resize: true,
        template: (task: PlanningTask) => task.text,
      },
    ];
    if (visible.has('forme')) {
      columns.push({
        name: 'forme',
        label: this.translate.instant('chantiers.planning.grid.forme'),
        width: 78,
        align: 'center',
        template: (task: PlanningTask) => this.formeLabel(task.forme),
      });
    }
    if (visible.has('start_date')) {
      columns.push({
        name: 'start_date',
        label: this.translate.instant('chantiers.planning.grid.debut'),
        width: 88,
        align: 'center',
        template: (task: PlanningTask) => this.formatGridDate(task.start_date),
      });
    }
    if (visible.has('end_date')) {
      columns.push({
        name: 'end_date',
        label: this.translate.instant('chantiers.planning.grid.fin'),
        width: 88,
        align: 'center',
        template: (task: PlanningTask) => this.formatGridDate(this.visibleEnd(task)),
      });
    }
    if (visible.has('duree')) {
      columns.push({
        name: 'duree',
        label: this.translate.instant('chantiers.planning.grid.duree'),
        width: 88,
        align: 'center',
        template: (task: PlanningTask) => task.dureeLabel || '',
      });
    }
    if (visible.has('predecessors')) {
      columns.push({
        name: 'predecessors',
        label: this.translate.instant('chantiers.planning.grid.predecessors'),
        width: 140,
        align: 'left',
        template: (task: PlanningTask) => task.predecessorsLabel || '—',
      });
    }
    this.ganttInstance.config.columns = columns;

    this.configureScale(granularity);

    const from = this.safeDay(rangeStart);
    const to = this.safeDay(rangeEnd);
    const scaleStart = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 7);
    let scaleEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 8);
    if (scaleEnd.getTime() <= scaleStart.getTime()) {
      scaleEnd = new Date(scaleStart.getTime() + 14 * 86400000);
    }
    config['fit_tasks'] = true;
    config['show_tasks_outside_timescale'] = true;
    config['start_date'] = scaleStart;
    config['end_date'] = scaleEnd;

    this.ganttInstance.templates.task_class = (_start, _end, task: PlanningTask) =>
      `planning-task planning-task--${task.recordType.toLowerCase()} planning-task--${task.status.toLowerCase()} ${this.facade.showCritical() && this.facade.simulation()?.rows.some(r => r.id === task.id && r.critical) ? 'planning-task--critical' : ''}`;
    this.ganttInstance.templates.grid_row_class = (_start, _end, task: PlanningTask) => `planning-row planning-row--${task.recordType.toLowerCase()}`;
    this.ganttInstance.templates.task_text = (_start, _end, task: PlanningTask) =>
      task.recordType === 'ACTIVITE' ? `${Math.round(task.progress * 100)}%` : '';
    this.ganttInstance.templates.tooltip_text = (_start, _end, task: PlanningTask) =>
      `<div class="planning-tooltip"><strong>${task.text}</strong><br/>${this.formatUiDate(task.start_date)} → ${this.formatUiDate(this.visibleEnd(task))}<br/>Avancement: ${Math.round((task.progress || 0) * 100)}%</div>`;

  }

  private updateTodayMarker(): void {
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
      this.ganttInstance.attachEvent('onTaskOpened', (id: string | number) => { this.treeExpansion.set(String(id), true); }),
      this.ganttInstance.attachEvent('onTaskClosed', (id: string | number) => { this.treeExpansion.set(String(id), false); }),
    );
    this.ganttEventIds.push(
      this.ganttInstance.attachEvent('onTaskClick', (id: string | number, event: MouseEvent) => {
        if ((event.target as HTMLElement | null)?.closest('.gantt_open, .gantt_close')) return true;
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

  }

  private formeLabel(forme: PlanningTask['forme']): string {
    if (forme === 'PHASE') {
      return this.translate.instant('chantiers.planning.formes.phase');
    }
    if (forme === 'JALON') {
      return this.translate.instant('chantiers.planning.formes.jalon');
    }
    if (forme === 'ACTIVITE') {
      return this.translate.instant('chantiers.planning.formes.activite');
    }
    return '';
  }

  private visibleEnd(task: PlanningTask): Date {
    const end = task.end_date;
    if (task.forme === 'JALON') return task.start_date;
    if (!end || Number.isNaN(end.getTime())) {
      return task.start_date;
    }
    return new Date(end.getTime() - 86400000);
  }

  private safeDay(value: Date): Date {
    if (!value || Number.isNaN(value.getTime())) {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private formatUiDate(value: Date): string {
    if (!value || Number.isNaN(value.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(value);
  }

  private formatGridDate(value: Date): string {
    if (!value || Number.isNaN(value.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: 'short',
    }).format(value);
  }
}
