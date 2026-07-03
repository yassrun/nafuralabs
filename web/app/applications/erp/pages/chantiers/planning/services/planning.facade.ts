import { Injectable, computed, inject, signal } from '@angular/core';

import { ChantierApiService } from '../../services/chantier-api.service';
import { ChantierLotApiService } from '../../services/chantier-lot-api.service';
import { ChantierPhaseApiService } from '../../services/chantier-phase-api.service';
import { HseVisiteMedicalePlanningService } from '../../../hse/services/hse-visite-medicale-planning.service';
import type {
  Chantier,
  LotChantier,
  PhaseChantier,
  PhaseChantierStatus,
  PlanningDisplayMode,
  PlanningGranularity,
  PlanningPeriodPreset,
} from '../../../../chantiers/models';

export interface PlanningLegendItem {
  status: PhaseChantierStatus;
  label: string;
  color: 'blue' | 'green' | 'orange' | 'gray';
  count: number;
  active: boolean;
}

export interface PlanningPhaseDetail {
  chantier: Chantier;
  lot?: LotChantier;
  phase: PhaseChantier;
}

export interface PlanningRange {
  start: Date;
  end: Date;
}

type GanttRecordType = 'CHANTIER' | 'LOT' | 'PHASE';

export interface PlanningTask {
  id: string;
  text: string;
  start_date: Date;
  end_date: Date;
  progress: number;
  parent: string | number;
  type?: string;
  open?: boolean;
  readonly?: boolean;
  recordType: GanttRecordType;
  status: PhaseChantierStatus;
  chantierId: string;
  lotId?: string;
  phaseId?: string;
}

export interface PlanningLink {
  id: string;
  source: string | number;
  target: string | number;
  type: string;
}

export interface PlanningDataset {
  tasks: PlanningTask[];
  links: PlanningLink[];
}

const ROOT_TASK_ID = 0;

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function endExclusive(value: string): Date {
  const date = parseDate(value);
  date.setDate(date.getDate() + 1);
  return date;
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function endOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

function quarterStart(value: Date): Date {
  return new Date(value.getFullYear(), Math.floor(value.getMonth() / 3) * 3, 1);
}

function quarterEnd(value: Date): Date {
  return new Date(value.getFullYear(), Math.floor(value.getMonth() / 3) * 3 + 3, 0);
}

function statusColor(status: PhaseChantierStatus): 'blue' | 'green' | 'orange' | 'gray' {
  switch (status) {
    case 'PLANIFIE':
      return 'blue';
    case 'EN_COURS':
      return 'green';
    case 'EN_RETARD':
      return 'orange';
    case 'TERMINE':
      return 'gray';
  }
}

function aggregateStatus(phases: PhaseChantier[]): PhaseChantierStatus {
  if (phases.some((phase) => phase.status === 'EN_RETARD')) {
    return 'EN_RETARD';
  }

  if (phases.some((phase) => phase.status === 'EN_COURS')) {
    return 'EN_COURS';
  }

  if (phases.every((phase) => phase.status === 'TERMINE')) {
    return 'TERMINE';
  }

  return 'PLANIFIE';
}

function averageProgress(phases: PhaseChantier[]): number {
  if (!phases.length) {
    return 0;
  }

  return phases.reduce((sum, phase) => sum + phase.avancementPercent, 0) / phases.length / 100;
}

function overlapsRange(phase: PhaseChantier, range: PlanningRange): boolean {
  const start = parseDate(phase.dateDebut);
  const end = parseDate(phase.dateFin);
  return start <= range.end && end >= range.start;
}

@Injectable({ providedIn: 'root' })
export class PlanningFacade {
  private readonly chantierApi = inject(ChantierApiService);
  private readonly lotApi = inject(ChantierLotApiService);
  private readonly phaseApi = inject(ChantierPhaseApiService);
  private readonly visitePlanning = inject(HseVisiteMedicalePlanningService);

  private readonly _chantiers = signal<Chantier[]>([]);
  private readonly _lots = signal<LotChantier[]>([]);
  private readonly _phases = signal<PhaseChantier[]>([]);
  readonly loading = signal(false);

  readonly selectedChantierIds = signal<string[]>([]);
  readonly granularity = signal<PlanningGranularity>('WEEK');
  readonly displayMode = signal<PlanningDisplayMode>('BOTH');
  readonly periodPreset = signal<PlanningPeriodPreset>('THIS_QUARTER');
  readonly selectedPhaseId = signal<string | null>(null);
  readonly selectedTaskId = signal<string | null>(null);
  readonly legendFilter = signal<PhaseChantierStatus[]>([]);
  readonly customRange = signal<PlanningRange | null>(null);

  readonly chantiers = computed(() => this._chantiers().filter((chantier) => chantier.isActive));
  readonly lots = computed(() => this._lots());
  readonly phases = computed(() => this._phases());

  constructor() {
    void this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const { items } = await this.chantierApi.getAll({ page: 1, pageSize: 500 });
      const active = items.filter((c) => c.isActive);
      this._chantiers.set(active);

      const lots: LotChantier[] = [];
      const phases: PhaseChantier[] = [];
      await Promise.all(
        active.map(async (chantier) => {
          const [chantierLots, chantierPhases] = await Promise.all([
            this.lotApi.listByChantier(chantier.id),
            this.phaseApi.listByChantier(chantier.id),
          ]);
          lots.push(...chantierLots);
          phases.push(...chantierPhases);
        }),
      );
      this._lots.set(lots);
      this._phases.set(phases);
    } catch {
      this._chantiers.set([]);
      this._lots.set([]);
      this._phases.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  readonly selectedChantiers = computed(() => {
    const selectedIds = this.selectedChantierIds();
    if (!selectedIds.length) {
      return this.chantiers();
    }

    return this.chantiers().filter((chantier) => selectedIds.includes(chantier.id));
  });

  readonly periodRange = computed<PlanningRange>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedPhases = this.phases().filter((phase) => this.selectedChantiers().some((chantier) => chantier.id === phase.chantierId));
    const allDates = selectedPhases.flatMap((phase) => [parseDate(phase.dateDebut), parseDate(phase.dateFin)]);
    const sorted = [...allDates].sort((left, right) => left.getTime() - right.getTime());
    const minSeedDate = sorted[0] ?? today;
    const maxSeedDate = sorted.at(-1) ?? today;

    switch (this.periodPreset()) {
      case 'THIS_MONTH':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'THIS_QUARTER':
        return { start: quarterStart(today), end: quarterEnd(today) };
      case 'THIS_YEAR':
        return { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 11, 31) };
      case 'ROLLING_6_MONTHS':
        return { start: new Date(today.getFullYear(), today.getMonth() - 2, 1), end: new Date(today.getFullYear(), today.getMonth() + 3, 0) };
      case 'ALL':
      default:
        return { start: minSeedDate, end: maxSeedDate };
    }
  });

  readonly effectiveRange = computed(() => this.customRange() ?? this.periodRange());

  readonly visiblePhases = computed(() => {
    const selectedIds = new Set(this.selectedChantiers().map((chantier) => chantier.id));
    const legend = this.legendFilter();
    const range = this.effectiveRange();

    return this.phases()
      .filter((phase) => selectedIds.has(phase.chantierId))
      .filter((phase) => overlapsRange(phase, range))
      .filter((phase) => !legend.length || legend.includes(phase.status))
      .sort((left, right) => parseDate(left.dateDebut).getTime() - parseDate(right.dateDebut).getTime());
  });

  readonly legend = computed<PlanningLegendItem[]>(() => {
    const selectedIds = new Set(this.selectedChantiers().map((chantier) => chantier.id));
    const phases = this.phases().filter((phase) => selectedIds.has(phase.chantierId));
    const currentFilter = this.legendFilter();

    return (['PLANIFIE', 'EN_COURS', 'EN_RETARD', 'TERMINE'] as PhaseChantierStatus[]).map((status) => ({
      status,
      label:
        status === 'PLANIFIE'
          ? 'Planifié'
          : status === 'EN_COURS'
            ? 'En cours'
            : status === 'EN_RETARD'
              ? 'En retard'
              : 'Terminé',
      color: statusColor(status),
      count: phases.filter((phase) => phase.status === status).length,
      active: !currentFilter.length || currentFilter.includes(status),
    }));
  });

  readonly ganttDataset = computed<PlanningDataset>(() => {
    const visiblePhases = this.visiblePhases();
    const visiblePhaseIds = new Set(visiblePhases.map((phase) => phase.id));
    const tasks: PlanningTask[] = [];
    const links: PlanningLink[] = [];
    const displayMode = this.displayMode();

    for (const chantier of this.selectedChantiers()) {
      const chantierPhases = visiblePhases.filter((phase) => phase.chantierId === chantier.id);
      if (!chantierPhases.length) {
        continue;
      }

      tasks.push(this.createParentTask({
        id: chantier.id,
        text: `${chantier.code} - ${chantier.name}`,
        parent: ROOT_TASK_ID,
        chantierId: chantier.id,
        recordType: 'CHANTIER',
        phases: chantierPhases,
      }));

      if (displayMode === 'PHASES') {
        chantierPhases.forEach((phase) => tasks.push(this.createPhaseTask(phase, chantier.id)));
      } else {
        const chantierLots = this.lots()
          .filter((lot) => lot.chantierId === chantier.id)
          .filter((lot) => chantierPhases.some((phase) => phase.lotId === lot.id))
          .sort((left, right) => left.ordre - right.ordre);

        chantierLots.forEach((lot) => {
          const lotPhases = chantierPhases.filter((phase) => phase.lotId === lot.id);
          tasks.push(this.createParentTask({
            id: lot.id,
            text: `${lot.code} ${lot.designation}`,
            parent: chantier.id,
            chantierId: chantier.id,
            lotId: lot.id,
            recordType: 'LOT',
            phases: lotPhases,
          }));

          if (displayMode === 'BOTH') {
            lotPhases.forEach((phase) => tasks.push(this.createPhaseTask(phase, lot.id)));
          }
        });
      }
    }

    if (displayMode !== 'LOTS') {
      visiblePhases.forEach((phase) => {
        (phase.dependances ?? []).forEach((dependencyId) => {
          if (!visiblePhaseIds.has(dependencyId)) {
            return;
          }

          links.push({
            id: `link-${dependencyId}-${phase.id}`,
            source: dependencyId,
            target: phase.id,
            type: '0',
          });
        });
      });
    }

    return { tasks, links };
  });

  readonly selectedPhaseDetail = computed<PlanningPhaseDetail | null>(() => {
    const phaseId = this.selectedPhaseId();
    if (!phaseId) {
      return null;
    }

    const phase = this.phases().find((item) => item.id === phaseId);
    if (!phase) {
      return null;
    }

    const chantier = this.chantiers().find((item) => item.id === phase.chantierId);
    if (!chantier) {
      return null;
    }

    const lot = phase.lotId ? this.lots().find((item) => item.id === phase.lotId) : undefined;
    return { chantier, lot, phase };
  });

  readonly summary = computed(() => {
    const phases = this.visiblePhases();
    return {
      chantierCount: this.selectedChantiers().length,
      phaseCount: phases.length,
      lateCount: phases.filter((phase) => phase.status === 'EN_RETARD').length,
      completion: phases.length
        ? Math.round(phases.reduce((sum, phase) => sum + phase.avancementPercent, 0) / phases.length)
        : 0,
      monoChantier: this.selectedChantiers().length === 1 ? this.selectedChantiers()[0] : null,
    };
  });

  setSelectedChantiers(ids: string[]): void {
    this.selectedChantierIds.set(ids);
  }

  setGranularity(value: PlanningGranularity): void {
    this.granularity.set(value);
  }

  setDisplayMode(value: PlanningDisplayMode): void {
    this.displayMode.set(value);
  }

  setPeriodPreset(value: PlanningPeriodPreset): void {
    this.periodPreset.set(value);
  }

  clearCustomRange(): void {
    this.customRange.set(null);
  }

  toggleLegend(status: PhaseChantierStatus): void {
    this.legendFilter.update((current) => {
      if (!current.length) {
        return this.legend().filter((item) => item.status !== status).map((item) => item.status);
      }

      const next = current.includes(status) ? current.filter((item) => item !== status) : [...current, status];
      return next.length === this.legend().length ? [] : next;
    });
  }

  openPhase(id: string | null): void {
    this.selectedPhaseId.set(id);
  }

  setSelectedTask(id: string | null): void {
    this.selectedTaskId.set(id);
  }

  shiftRange(direction: -1 | 1): void {
    const currentRange = this.effectiveRange();
    const offsetDays = this.granularity() === 'DAY' ? 1 : this.granularity() === 'WEEK' ? 7 : this.granularity() === 'MONTH' ? 30 : 90;
    const start = new Date(currentRange.start);
    const end = new Date(currentRange.end);
    start.setDate(start.getDate() + direction * offsetDays);
    end.setDate(end.getDate() + direction * offsetDays);
    this.customRange.set({ start, end });
  }

  updatePhaseDates(id: string, startDate: Date, endDate: Date): { ok: boolean; message?: string } {
    const phase = this.phases().find((p) => p.id === id);
    if (phase) {
      const gate = this.visitePlanning.evaluatePhaseReschedule(phase);
      if (!gate.ok) {
        return gate;
      }
    }
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const dateDebut = this.toIsoDate(startDate);
    const dateFin = this.toIsoDate(end);
    this._phases.update((items) =>
      items.map((phase) => (phase.id === id ? { ...phase, dateDebut, dateFin } : phase)),
    );
    return { ok: true };
  }

  private createParentTask(input: {
    id: string;
    text: string;
    parent: string | number;
    chantierId: string;
    lotId?: string;
    recordType: GanttRecordType;
    phases: PhaseChantier[];
  }): PlanningTask {
    const starts = input.phases.map((phase) => parseDate(phase.dateDebut)).sort((left, right) => left.getTime() - right.getTime());
    const ends = input.phases.map((phase) => endExclusive(phase.dateFin)).sort((left, right) => left.getTime() - right.getTime());

    return {
      id: input.id,
      text: input.text,
      start_date: starts[0],
      end_date: ends.at(-1)!,
      progress: averageProgress(input.phases),
      parent: input.parent,
      type: 'project',
      open: true,
      readonly: true,
      recordType: input.recordType,
      status: aggregateStatus(input.phases),
      chantierId: input.chantierId,
      lotId: input.lotId,
    };
  }

  private createPhaseTask(phase: PhaseChantier, parent: string): PlanningTask {
    return {
      id: phase.id,
      text: `${phase.code} ${phase.designation}`,
      start_date: parseDate(phase.dateDebut),
      end_date: endExclusive(phase.dateFin),
      progress: phase.avancementPercent / 100,
      parent,
      open: true,
      readonly: false,
      recordType: 'PHASE',
      status: phase.status,
      chantierId: phase.chantierId,
      lotId: phase.lotId,
      phaseId: phase.id,
    };
  }

  private toIsoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}