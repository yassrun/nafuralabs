import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { gantt, type GanttStatic } from 'dhtmlx-gantt';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import type { AffectationChantier } from '@applications/erp/inventory/models';
import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

interface MgTask {
  id: string;
  text: string;
  start_date: Date;
  end_date: Date;
  parent: string | number;
  progress: number;
  open?: boolean;
  type?: string;
  conflict?: boolean;
  affectationId?: string;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

function buildConflictSet(rows: AffectationChantier[]): Set<string> {
  const conflicts = new Set<string>();
  const byEngine = new Map<string, AffectationChantier[]>();
  for (const r of rows) {
    const list = byEngine.get(r.materielId) ?? [];
    list.push(r);
    byEngine.set(r.materielId, list);
  }
  for (const [, list] of byEngine) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aStart = parseIso(a.dateDebut);
        const aEnd = a.dateFin ? addDays(parseIso(a.dateFin), 1) : addDays(aStart, 400);
        const bStart = parseIso(b.dateDebut);
        const bEnd = b.dateFin ? addDays(parseIso(b.dateFin), 1) : addDays(bStart, 400);
        if (!overlaps(aStart, aEnd, bStart, bEnd)) continue;
        const active = (x: AffectationChantier) => x.status === 'AFFECTE' || x.status === 'MAINTENANCE';
        if (active(a) && active(b)) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  }
  return conflicts;
}

function buildTasks(rows: AffectationChantier[], conflicts: Set<string>): MgTask[] {
  const engines = [...new Set(rows.map((r) => r.materielId))];
  const children: MgTask[] = rows.map((r) => {
    const start = parseIso(r.dateDebut);
    const endExclusive = r.dateFin ? addDays(parseIso(r.dateFin), 1) : addDays(start, 120);
    const hasConflict = conflicts.has(r.id);
    return {
      id: `aff-${r.id}`,
      affectationId: r.id,
      text: `${r.materielName ?? r.materielId} — ${r.chantierRef}${hasConflict ? ' ⚠' : ''}`,
      start_date: start,
      end_date: endExclusive,
      parent: `eng-${r.materielId}`,
      progress: r.status === 'AFFECTE' ? 0.35 : 0.1,
      conflict: hasConflict,
    };
  });
  const parents: MgTask[] = engines.map((id) => {
    const mine = children.filter((c) => c.parent === `eng-${id}`);
    const starts = mine.map((c) => (c.start_date as Date).getTime());
    const ends = mine.map((c) => (c.end_date as Date).getTime());
    const start = new Date(Math.min(...starts));
    const end = new Date(Math.max(...ends));
    const name = rows.find((r) => r.materielId === id)?.materielName ?? id;
    return {
      id: `eng-${id}`,
      text: name,
      type: 'project',
      open: true,
      start_date: start,
      end_date: end,
      parent: 0,
      progress: 0,
    };
  });
  return [...parents, ...children];
}

@Component({
  selector: 'app-materiel-planning',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="false">
      <nf-page-header [config]="header()"></nf-page-header>
      <p class="hint">{{ 'materielGmao.planning.hint' | translate }}</p>
      <div #ganttHost class="gantt-host" tabindex="0"></div>
    </nf-page-shell>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .hint {
        margin: 0 0 0.5rem;
        color: var(--nf-color-text-secondary);
        font-size: 0.85rem;
      }
      .gantt-host {
        height: min(72vh, 640px);
        width: 100%;
        border: 1px solid var(--nf-color-border);
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--nf-color-surface);
      }
      :host ::ng-deep .materiel-gantt-task--conflict .gantt_task_line {
        background-color: var(--nf-color-danger-600) !important;
      }
    `,
  ],
})
export class MaterielPlanningPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ganttHost = viewChild<ElementRef<HTMLDivElement>>('ganttHost');

  readonly merged = toSignal(this.gmao.getMergedAffectations(), { initialValue: [] as AffectationChantier[] });

  readonly header = computed(() => ({
    title: 'materielGmao.planning.title',
    subtitle: 'materielGmao.planning.subtitle',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.planning.title') },
    ],
  }));

  private readonly ganttInstance: GanttStatic = gantt;
  private ganttInitialized = false;
  private ganttEventIds: string[] = [];

  constructor() {
    effect(() => {
      const host = this.ganttHost()?.nativeElement;
      const rows = this.merged();
      if (!host) {
        return;
      }
      if (!rows.length) {
        if (this.ganttInitialized) {
          this.ganttInstance.clearAll();
        }
        return;
      }
      const conflicts = buildConflictSet(rows);
      const tasks = buildTasks(rows, conflicts);
      queueMicrotask(() => this.render(host, tasks));
    });

    this.destroyRef.onDestroy(() => {
      if (this.ganttInitialized) {
        this.ganttInstance.clearAll();
        this.ganttEventIds.forEach((id) => this.ganttInstance.detachEvent(id));
      }
    });
  }

  private render(host: HTMLDivElement, tasks: MgTask[]): void {
    this.ganttInstance.plugins({ tooltip: true, marker: true });
    this.ganttInstance.config['date_format'] = '%Y-%m-%d %H:%i';
    this.ganttInstance.config['drag_links'] = false;
    this.ganttInstance.config['drag_progress'] = false;
    this.ganttInstance.config['drag_resize'] = true;
    this.ganttInstance.config['drag_move'] = true;
    this.ganttInstance.config['row_height'] = 40;
    this.ganttInstance.config['bar_height'] = 18;
    this.ganttInstance.config['columns'] = [
      { name: 'text', label: 'Engin / chantier', tree: true, width: 280 },
    ];
    this.ganttInstance.config['scale_unit'] = 'week';
    this.ganttInstance.config['step'] = 1;
    this.ganttInstance.config['date_scale'] = 'Semaine %W';

    this.ganttInstance.templates.task_class = (_s, _e, task: MgTask) => {
      const cls = ['materiel-gantt-task'];
      if (task.conflict) cls.push('materiel-gantt-task--conflict');
      return cls.join(' ');
    };
    this.ganttInstance.templates.tooltip_text = (_s, _e, task: MgTask) => {
      if (!task.affectationId) return task.text;
      const tip = this.translate.instant('materielGmao.planning.conflictTooltip');
      return task.conflict ? `<span>${tip}</span><br/>${task.text}` : task.text;
    };

    if (!this.ganttInitialized) {
      this.ganttInstance.init(host);
      this.ganttEventIds.push(
        this.ganttInstance.attachEvent('onAfterTaskDrag', (id: string | number) => {
          const task = this.ganttInstance.getTask(id) as MgTask;
          const aid = task.affectationId;
          if (!aid) return true;
          const start = task.start_date as Date;
          const endInclusive = addDays(task.end_date as Date, -1);
          this.gmao.patchPlanningDates(aid, {
            dateDebut: start.toISOString().slice(0, 10),
            dateFin: endInclusive.toISOString().slice(0, 10),
          });
          return true;
        }),
      );
      this.ganttInitialized = true;
    }

    this.ganttInstance.clearAll();
    this.ganttInstance.parse({ data: tasks as never[], links: [] });
    this.ganttInstance.render();
  }
}
