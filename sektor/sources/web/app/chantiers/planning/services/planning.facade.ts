import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthFacade } from '@platform/core/security/services/auth.facade';

import { BudgetApiService } from '../../budget/services/budget-api.service';
import type { BudgetArbre, BudgetNoeud } from '../../budget/models/budget.model';
import { ChantierApiService } from '../../services/chantier-api.service';
import {
  ActiviteApiService,
  type ActiviteChantier,
  type ActiviteForme,
  type ActivitePrecedence,
  type ActiviteStatus,
  type CalendrierChantier,
  type CalendrierVersionWrite,
  type PlanningCapacites,
  type PlanningSimulation,
  type ZoneChantier,
} from '../../services/activite-api.service';
import type { Chantier, PlanningGranularity, PlanningPeriodPreset } from '../../models';
import { PLANNING_NATURES } from './planning-natures';

export interface PlanningLegendItem {
  status: ActiviteStatus;
  label: string;
  color: 'blue' | 'green' | 'orange' | 'gray';
  count: number;
  active: boolean;
}

export interface PlanningActiviteDetail {
  chantier: Chantier;
  activite: ActiviteChantier;
  predecessors: ActivitePrecedence[];
}

export interface PlanningRange {
  start: Date;
  end: Date;
}

export type PlanningDrawerMode = 'create' | 'edit';
export type PlanningLoadStatus = 'loading' | 'ready' | 'error' | 'forbidden';
export type PlanningPageState = 'loading' | 'empty' | 'error' | 'filtered' | 'forbidden' | 'ready';
export type PlanningGrouping = 'wbs' | 'none';
export type PlanningSort = 'ordre' | 'dateDebut';

export const DEFAULT_PLANNING_COLUMNS = ['text', 'start_date', 'end_date', 'duree'] as const;

export interface ActiviteDraft {
  chantierId: string;
  activiteId?: string;
  libelle: string;
  forme: ActiviteForme;
  natureCode: string;
  dateDebut: string;
  dateFin: string;
  dureeMinutesOuvrees: number | null;
  calendrierSpecifique?: CalendrierVersionWrite | null;
  parentActiviteId: string;
  zoneId: string;
}

export interface PlanningSavedView {
  id: string;
  name: string;
  chantierIds: string[];
  periodPreset: PlanningPeriodPreset;
  granularity: PlanningGranularity;
  legendFilter: ActiviteStatus[];
  natureFilter: string;
  columns: string[];
  showLinks?: boolean;
  grouping: PlanningGrouping;
  sort: PlanningSort;
}

export interface PlanningCalendarContext {
  fuseauIana: string;
  versionLabel: string;
  heuresParJour: number;
  dateEffet?: string;
  kind?: string;
  creneaux: { jourSemaine?: number; heureDebut: string; heureFin: string; lendemain?: boolean }[];
  exceptions: import('../../services/activite-api.service').CalendrierException[];
}

export interface PlanningNoeudOption {
  id: string;
  type: 'LOT' | 'SOUS_LOT' | 'POSTE';
  code: string;
  designation: string;
  unite: string;
  quantitePrevue: number;
  reste: number;
}

type GanttRecordType = 'CHANTIER' | 'ACTIVITE';

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
  status: ActiviteStatus;
  chantierId: string;
  activiteId?: string;
  forme?: ActiviteForme | 'CHANTIER';
  dureeLabel: string;
  predecessorsLabel: string;
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

/** dhtmlx link types: 0=FD, 1=SS(DD), 2=FF, 3=SF(DF) */
function linkTypeCode(typeLien: string): string {
  switch (typeLien) {
    case 'DD':
      return '1';
    case 'FF':
      return '2';
    case 'DF':
      return '3';
    case 'FD':
    default:
      return '0';
  }
}

function parseDate(value: string): Date {
  if (!value) {
    return new Date(Number.NaN);
  }
  if (value.includes('T')) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }
  return new Date(`${value.slice(0, 10)}T00:00:00`);
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

function statusColor(status: ActiviteStatus): 'blue' | 'green' | 'orange' | 'gray' {
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

function overlapsRange(activite: ActiviteChantier, range: PlanningRange): boolean {
  const start = parseDate(activite.dateDebut);
  const end = parseDate(activite.dateFin);
  return start <= range.end && end >= range.start;
}

export function toIsoDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function plusDays(iso: string, days: number): string {
  const date = parseDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function httpStatus(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}

function creneauMinutes(debut: string, fin: string): number {
  const [h1, m1] = debut.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

export function formatDureeOuvree(minutes: number | null | undefined, forme?: ActiviteForme | null): string {
  if (forme === 'PHASE') {
    return 'dérivée';
  }
  if (minutes == null) {
    return 'à qualifier';
  }
  if (minutes === 0) {
    return '0';
  }
  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    return `${hours} h`;
  }
  return `${hours.toFixed(1)} h`;
}

const DEFAULT_CAPACITES: PlanningCapacites = {
  lire: true,
  editerStructure: false,
  proposerStructure: false,
  administrerCalendrier: false,
  proposerCalendrier: false,
  gererVues: false,
};

const DEFAULT_CALENDAR: PlanningCalendarContext = {
  fuseauIana: 'Africa/Casablanca',
  versionLabel: 'défaut',
  heuresParJour: 8,
  creneaux: [
    { jourSemaine: 1, heureDebut: '08:00', heureFin: '16:00' },
    { jourSemaine: 2, heureDebut: '08:00', heureFin: '16:00' },
    { jourSemaine: 3, heureDebut: '08:00', heureFin: '16:00' },
    { jourSemaine: 4, heureDebut: '08:00', heureFin: '16:00' },
    { jourSemaine: 5, heureDebut: '08:00', heureFin: '16:00' },
  ],
  exceptions: [],
};

function viewsStorageKey(tenantId: string | undefined, userId: string | undefined): string {
  return `nafura.planning.vues.${tenantId ?? 'tenant'}.${userId ?? 'user'}`;
}

function readApiMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (error.error && typeof error.error === 'object') {
      const message = (error.error as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Enregistrement refusé';
}

export function messageDepassementPoste(raw: string): string | null {
  if (!/quotite_depassement|depassement_quotite/i.test(raw)) {
    return null;
  }
  const reste = raw.match(/reste=([0-9.]+)/i)?.[1];
  if (reste) {
    return `Reste ${reste} sur le poste — la quantité prévue dépasse ce qui reste.`;
  }
  return 'La quantité prévue dépasse le reste sur le poste.';
}

function flattenNoeuds(nodes: BudgetNoeud[] | undefined, out: BudgetNoeud[] = []): BudgetNoeud[] {
  for (const node of nodes ?? []) {
    out.push(node);
    flattenNoeuds(node.enfants, out);
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class PlanningFacade {
  private readonly chantierApi = inject(ChantierApiService);
  private readonly activiteApi = inject(ActiviteApiService);
  private readonly budgetApi = inject(BudgetApiService);
  private readonly auth = inject(AuthFacade);

  private readonly _chantiers = signal<Chantier[]>([]);
  private readonly _activites = signal<ActiviteChantier[]>([]);
  private readonly _precedences = signal<ActivitePrecedence[]>([]);
  private readonly _zonesByChantier = signal<Record<string, ZoneChantier[]>>({});
  private readonly _arbres = signal<Record<string, BudgetArbre>>({});
  private readonly _calendrier = signal<CalendrierChantier | null>(null);
  private readonly _capacites = signal<PlanningCapacites>(DEFAULT_CAPACITES);
  private readonly _savedViews = signal<PlanningSavedView[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly drawerError = signal<string | null>(null);
  readonly loadStatus = signal<PlanningLoadStatus>('loading');
  readonly loadError = signal<string | null>(null);
  readonly calendarScope = signal<'chantier' | 'activite'>('chantier');
  readonly calendarEditorContext = computed(() => {
    const specific = this.calendarScope() === 'activite' ? this.draft()?.calendrierSpecifique : null;
    return specific ? { ...this.calendarContext(), ...specific, exceptions: specific.exceptions ?? [] } : this.calendarContext();
  });
  readonly calendarOpen = signal(false);
  readonly calendarError = signal<string | null>(null);
  readonly viewsOpen = signal(false);
  private loadGeneration = 0;

  readonly selectedChantierIds = signal<string[]>([]);
  readonly granularity = signal<PlanningGranularity>('WEEK');
  readonly periodPreset = signal<PlanningPeriodPreset>('THIS_QUARTER');
  readonly selectedActiviteId = signal<string | null>(null);
  readonly selectedTaskId = signal<string | null>(null);
  readonly legendFilter = signal<ActiviteStatus[]>([]);
  readonly natureFilter = signal('');
  readonly customRange = signal<PlanningRange | null>(null);
  readonly simulation = signal<PlanningSimulation | null>(null);
  readonly simulationError = signal('');
  readonly simulating = signal(false);
  readonly showCritical = signal(false);
  readonly showLinks = signal(true);
  readonly visibleColumns = signal<string[]>([...DEFAULT_PLANNING_COLUMNS]);
  readonly grouping = signal<PlanningGrouping>('wbs');
  readonly sort = signal<PlanningSort>('ordre');
  readonly drawerMode = signal<PlanningDrawerMode | null>(null);
  readonly draft = signal<ActiviteDraft | null>(null);

  readonly chantiers = computed(() => this._chantiers().filter((chantier) => chantier.isActive));
  readonly activites = computed(() => this._activites());
  readonly capacites = computed(() => this._capacites());
  readonly savedViews = computed(() => this._savedViews());
  readonly natures = PLANNING_NATURES;

  constructor() {
    this.hydrateViews();
    void this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.simulation.set(null);
    const generation = ++this.loadGeneration;
    this.loading.set(true);
    // Ne pas repasser par `loading` si le Gantt est déjà monté : @switch
    // détruirait l'hôte dhtmlx (singleton) et laisserait un rectangle blanc.
    if (this.loadStatus() !== 'ready') {
      this.loadStatus.set('loading');
    }
    this.loadError.set(null);
    try {
      const { items } = await this.chantierApi.getAll({ page: 1, pageSize: 500 });
      const active = items.filter((c) => c.isActive);
      this._chantiers.set(active);

      const selected = this.selectedChantierIds();
      const targets = selected.length ? selected : active.map((c) => c.id);
      const activites: ActiviteChantier[] = [];
      const precedences: ActivitePrecedence[] = [];
      const errors: unknown[] = [];
      let lastCapacites: PlanningCapacites | undefined;
      let successCount = 0;

      await Promise.all(
        targets.map(async (chantierId) => {
          try {
            const planning = await this.activiteApi.planning(chantierId);
            activites.push(...(planning.activites ?? []));
            precedences.push(...(planning.precedences ?? []));
            lastCapacites = planning.capacites ?? lastCapacites;
            successCount += 1;
          } catch (error) {
            errors.push(error);
          }
        }),
      );

      if (generation !== this.loadGeneration) {
        return;
      }

      if (targets.length > 0 && successCount === 0 && errors.length > 0) {
        this.applyLoadFailure(errors[0], selected.length === 1);
        return;
      }

      this._activites.set(activites);
      this._precedences.set(precedences);
      this._capacites.set(lastCapacites ?? { ...DEFAULT_CAPACITES, lire: true, editerStructure: true, gererVues: true });
      this.loadStatus.set('ready');
      await this.refreshCalendrier(selected.length === 1 ? selected[0] : null);
    } catch (error) {
      if (generation !== this.loadGeneration) {
        return;
      }
      this.applyLoadFailure(error, this.selectedChantierIds().length === 1);
    } finally {
      if (generation === this.loadGeneration) {
        this.loading.set(false);
      }
    }
  }

  retryLoad(): void {
    void this.loadAll();
  }

  private applyLoadFailure(error: unknown, singleChantier: boolean): void {
    const status = httpStatus(error);
    if (status === 403) {
      if (singleChantier) {
        this._activites.set([]);
        this._precedences.set([]);
      }
      this._capacites.set(DEFAULT_CAPACITES);
      this.loadStatus.set('forbidden');
      this.loadError.set(null);
      return;
    }
    this.loadStatus.set('error');
    this.loadError.set(readApiMessage(error));
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
    const selected = this.activites().filter((a) =>
      this.selectedChantiers().some((c) => c.id === a.chantierId),
    );
    const allDates = selected
      .flatMap((a) => [parseDate(a.dateDebut), parseDate(a.dateFin)])
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((left, right) => left.getTime() - right.getTime());
    const minSeedDate = allDates[0] ?? today;
    const maxSeedDate = allDates.at(-1) ?? today;

    switch (this.periodPreset()) {
      case 'THIS_MONTH':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'THIS_QUARTER':
        return { start: quarterStart(today), end: quarterEnd(today) };
      case 'THIS_YEAR':
        return { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 11, 31) };
      case 'ROLLING_6_MONTHS':
        return {
          start: new Date(today.getFullYear(), today.getMonth() - 2, 1),
          end: new Date(today.getFullYear(), today.getMonth() + 3, 0),
        };
      case 'ALL':
      default:
        return { start: minSeedDate, end: maxSeedDate };
    }
  });

  readonly effectiveRange = computed(() => this.customRange() ?? this.periodRange());

  readonly chantierActivites = computed(() => {
    const selectedIds = new Set(this.selectedChantiers().map((c) => c.id));
    if (!selectedIds.size) {
      return this.activites();
    }
    return this.activites().filter((a) => selectedIds.has(a.chantierId));
  });

  readonly hasActiveFilters = computed(() => {
    return (
      this.legendFilter().length > 0 ||
      !!this.natureFilter() ||
      this.periodPreset() !== 'ALL' ||
      this.customRange() !== null
    );
  });

  readonly pageState = computed<PlanningPageState>(() => {
    const status = this.loadStatus();
    if (status === 'loading') {
      return 'loading';
    }
    if (status === 'forbidden') {
      return 'forbidden';
    }
    if (status === 'error') {
      return 'error';
    }
    if (!this.chantierActivites().length) {
      return 'empty';
    }
    if (!this.visibleActivites().length) {
      return 'filtered';
    }
    return 'ready';
  });

  readonly calendarContext = computed<PlanningCalendarContext>(() => {
    const cal = this._calendrier();
    const version = cal?.versions?.at(-1);
    if (!version) {
      return DEFAULT_CALENDAR;
    }
    const byDay = new Map<number, number>();
    for (const slot of version.creneaux ?? []) {
      if (slot.jourSemaine == null) {
        continue;
      }
      byDay.set(slot.jourSemaine, (byDay.get(slot.jourSemaine) ?? 0) + creneauMinutes(slot.heureDebut, slot.heureFin));
    }
    const weekdayHours = [...byDay.values()].filter((m) => m > 0).map((m) => m / 60);
    const heuresParJour = weekdayHours.length
      ? Math.round((weekdayHours.reduce((s, h) => s + h, 0) / weekdayHours.length) * 10) / 10
      : 8;
    return {
      fuseauIana: version.fuseauIana || DEFAULT_CALENDAR.fuseauIana,
      versionLabel: `v${cal?.versions?.length ?? 1}`,
      heuresParJour,
      dateEffet: version.dateEffet,
      kind: cal?.kind,
      creneaux: version.creneaux ?? [],
      exceptions: version.exceptions ?? [],
    };
  });

  readonly visibleActivites = computed(() => {
    const selectedIds = new Set(this.selectedChantiers().map((c) => c.id));
    const legend = this.legendFilter();
    const nature = this.natureFilter();
    const range = this.effectiveRange();
    const sort = this.sort();
    return this.activites()
      .filter((a) => selectedIds.has(a.chantierId))
      .filter((a) => overlapsRange(a, range))
      .filter((a) => !legend.length || legend.includes(a.status))
      .filter((a) => !nature || a.natureCode === nature)
      .sort((left, right) => {
        if (sort === 'dateDebut') {
          return parseDate(left.dateDebut).getTime() - parseDate(right.dateDebut).getTime() || left.ordre - right.ordre;
        }
        return left.ordre - right.ordre || parseDate(left.dateDebut).getTime() - parseDate(right.dateDebut).getTime();
      });
  });

  readonly legend = computed<PlanningLegendItem[]>(() => {
    const selectedIds = new Set(this.selectedChantiers().map((c) => c.id));
    const activites = this.activites().filter((a) => selectedIds.has(a.chantierId));
    const currentFilter = this.legendFilter();
    return (['PLANIFIE', 'EN_COURS', 'EN_RETARD', 'TERMINE'] as ActiviteStatus[]).map((status) => ({
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
      count: activites.filter((a) => a.status === status).length,
      active: !currentFilter.length || currentFilter.includes(status),
    }));
  });

  readonly ganttDataset = computed<PlanningDataset>(() => {
    const visible = this.visibleActivites();
    const visibleIds = new Set(visible.map((a) => a.id));
    const tasks: PlanningTask[] = [];
    const links: PlanningLink[] = [];
    const mono = this.selectedChantiers().length === 1;

    for (const chantier of this.selectedChantiers()) {
      const chantierActivites = visible.filter((a) => a.chantierId === chantier.id);
      if (!chantierActivites.length) {
        continue;
      }

      if (!mono) {
        const starts = chantierActivites
          .map((a) => parseDate(a.dateDebut))
          .sort((l, r) => l.getTime() - r.getTime());
        const ends = chantierActivites
          .map((a) => endExclusive(a.dateFin))
          .sort((l, r) => l.getTime() - r.getTime());
        const avg =
          chantierActivites.reduce((sum, a) => sum + Number(a.avancementPercent ?? 0), 0) /
          chantierActivites.length /
          100;

        tasks.push({
          id: chantier.id,
          text: `${chantier.code} - ${chantier.name}`,
          start_date: starts[0],
          end_date: ends.at(-1)!,
          progress: avg,
          parent: ROOT_TASK_ID,
          type: 'project',
          open: true,
          readonly: true,
          recordType: 'CHANTIER',
          status: chantierActivites.some((a) => a.status === 'EN_RETARD')
            ? 'EN_RETARD'
            : chantierActivites.some((a) => a.status === 'EN_COURS')
              ? 'EN_COURS'
              : chantierActivites.every((a) => a.status === 'TERMINE')
                ? 'TERMINE'
                : 'PLANIFIE',
          chantierId: chantier.id,
          forme: 'CHANTIER',
          dureeLabel: '',
          predecessorsLabel: '',
        });
      }

      for (const activite of chantierActivites) {
        const parentFromWbs =
          this.grouping() === 'wbs' && activite.parentActiviteId && visibleIds.has(activite.parentActiviteId)
            ? activite.parentActiviteId
            : null;
        const parent = parentFromWbs ?? (mono ? ROOT_TASK_ID : chantier.id);
        const forme = (activite.forme ?? 'ACTIVITE') as ActiviteForme;
        const preds = this._precedences().filter((p) => p.succActiviteId === activite.id);
        tasks.push({
          id: activite.id,
          text: activite.code ? `${activite.code} ${activite.libelle}` : activite.libelle,
          start_date: parseDate(activite.dateDebut),
          end_date: endExclusive(activite.dateFin),
          progress: Number(activite.avancementPercent ?? 0) / 100,
          parent,
          type: forme === 'JALON' ? 'milestone' : forme === 'PHASE' ? 'project' : undefined,
          open: true,
          readonly: !!activite.planningRemainder,
          recordType: 'ACTIVITE',
          status: activite.status,
          chantierId: chantier.id,
          activiteId: activite.id,
          forme,
          dureeLabel: activite.planningRemainder && activite.status!=='TERMINE' && (activite.avancementPercent??0)<100 ? `${formatDureeOuvree(activite.planningRemainder.minutes, forme)} restantes` : formatDureeOuvree(activite.dureeMinutesOuvrees, forme),
          predecessorsLabel: this.formatPredecessors(preds),
        });
      }
    }

    for (const prec of this._precedences()) {
      if (!visibleIds.has(prec.predActiviteId) || !visibleIds.has(prec.succActiviteId)) {
        continue;
      }
      links.push({
        id: prec.id,
        source: prec.predActiviteId,
        target: prec.succActiviteId,
        type: linkTypeCode(prec.typeLien),
      });
    }

    return { tasks, links };
  });

  readonly selectedActiviteDetail = computed<PlanningActiviteDetail | null>(() => {
    const id = this.selectedActiviteId();
    if (!id) {
      return null;
    }
    const activite = this.activites().find((a) => a.id === id);
    if (!activite) {
      return null;
    }
    const chantier = this.chantiers().find((c) => c.id === activite.chantierId);
    if (!chantier) {
      return null;
    }
    const predecessors = this._precedences().filter((p) => p.succActiviteId === id);
    return { chantier, activite, predecessors };
  });

  readonly drawerOpen = computed(() => this.drawerMode() !== null);

  readonly summary = computed(() => {
    const activites = this.visibleActivites();
    return {
      chantierCount: this.selectedChantiers().length,
      activiteCount: activites.length,
      lateCount: activites.filter((a) => a.status === 'EN_RETARD').length,
      completion: activites.length
        ? Math.round(activites.reduce((sum, a) => sum + Number(a.avancementPercent ?? 0), 0) / activites.length)
        : 0,
      monoChantier: this.selectedChantiers().length === 1 ? this.selectedChantiers()[0] : null,
    };
  });

  readonly parentOptions = computed(() => {
    const draft = this.draft();
    if (!draft) {
      return [];
    }
    return this.activites()
      .filter((a) => a.chantierId === draft.chantierId && a.id !== draft.activiteId)
      .map((a) => ({ id: a.id, libelle: a.libelle }));
  });

  readonly zoneOptions = computed(() => {
    const draft = this.draft();
    if (!draft) {
      return [];
    }
    return this._zonesByChantier()[draft.chantierId] ?? [];
  });

  readonly noeudOptions = computed<PlanningNoeudOption[]>(() => {
    const draft = this.draft();
    if (!draft) {
      return [];
    }
    const arbre = this._arbres()[draft.chantierId];
    if (!arbre) {
      return [];
    }
    const alloue = this.quantiteAlloueeParNoeud();
    const currentIds = new Set(
      (this.selectedActiviteDetail()?.activite.rattachements ?? []).map((r) => r.posteId ?? r.lotId).filter(Boolean),
    );
    return flattenNoeuds(arbre.lots)
      .filter((n) => n.type === 'POSTE' || ((n.type === 'LOT' || n.type === 'SOUS_LOT') && !(n.enfants ?? []).length))
      .filter((n) => !currentIds.has(n.id))
      .map((n) => {
        const prevue = Number(n.quantitePrevue ?? 0);
        const deja = alloue.get(n.id) ?? 0;
        return {
          id: n.id,
          type: n.type,
          code: n.code,
          designation: n.designation,
          unite: n.unite ?? '',
          quantitePrevue: prevue,
          reste: Math.max(0, prevue - deja),
        };
      });
  });

  setSelectedChantiers(ids: string[]): void {
    this.selectedChantierIds.set(ids);
    void this.loadAll();
  }

  setNatureFilter(code: string): void {
    this.natureFilter.set(code);
  }

  setGrouping(value: PlanningGrouping): void {
    this.grouping.set(value);
  }

  setSort(value: PlanningSort): void {
    this.sort.set(value);
  }

  clearFilters(): void {
    this.legendFilter.set([]);
    this.natureFilter.set('');
    this.periodPreset.set('ALL');
    this.customRange.set(null);
  }

  setGranularity(value: PlanningGranularity): void {
    this.granularity.set(value);
  }

  setPeriodPreset(value: PlanningPeriodPreset): void {
    this.periodPreset.set(value);
  }

  clearCustomRange(): void {
    this.customRange.set(null);
  }

  toggleLegend(status: ActiviteStatus): void {
    this.legendFilter.update((current) => {
      if (!current.length) {
        return this.legend().filter((item) => item.status !== status).map((item) => item.status);
      }
      const next = current.includes(status) ? current.filter((item) => item !== status) : [...current, status];
      return next.length === this.legend().length ? [] : next;
    });
  }

  setSelectedTask(id: string | null): void {
    this.selectedTaskId.set(id);
  }

  shiftRange(direction: -1 | 1): void {
    const currentRange = this.effectiveRange();
    const offsetDays =
      this.granularity() === 'DAY' ? 1 : this.granularity() === 'WEEK' ? 7 : this.granularity() === 'MONTH' ? 30 : 90;
    const start = new Date(currentRange.start);
    const end = new Date(currentRange.end);
    start.setDate(start.getDate() + direction * offsetDays);
    end.setDate(end.getDate() + direction * offsetDays);
    this.customRange.set({ start, end });
  }

  patchDraft(patch: Partial<ActiviteDraft>): void {
    this.draft.update((current) => (current ? { ...current, ...patch } : current));
  }

  closeDrawer(): void {
    this.drawerMode.set(null);
    this.draft.set(null);
    this.selectedActiviteId.set(null);
    this.drawerError.set(null);
  }

  async openCreate(forme: ActiviteForme = 'ACTIVITE'): Promise<{ ok: boolean; message?: string }> {
    const mono = this.summary().monoChantier;
    if (!mono) {
      return { ok: false, message: 'Filtrez un chantier pour créer une activité.' };
    }
    if (!this.capacites().editerStructure && !this.capacites().proposerStructure) {
      return { ok: false, message: 'Vous ne pouvez pas modifier la structure de ce planning.' };
    }
    const today = toIsoDate(new Date());
    const hours = this.calendarContext().heuresParJour || 8;
    this.drawerError.set(null);
    this.selectedActiviteId.set(null);
    this.drawerMode.set('create');
    this.draft.set({
      chantierId: mono.id,
      libelle: '',
      forme,
      natureCode: '',
      dateDebut: today,
      dateFin: forme === 'JALON' ? today : plusDays(today, 1),
      dureeMinutesOuvrees: forme === 'JALON' ? 0 : forme === 'PHASE' ? null : Math.round(hours * 60),
      parentActiviteId: '',
      zoneId: '',
    });
    await this.ensureDrawerRefs(mono.id);
    return { ok: true };
  }

  async openActivite(id: string | null): Promise<void> {
    if (!id) {
      this.closeDrawer();
      return;
    }
    const activite = this.activites().find((a) => a.id === id);
    if (!activite) {
      return;
    }
    this.drawerError.set(null);
    this.selectedActiviteId.set(id);
    this.drawerMode.set('edit');
    this.draft.set({
      chantierId: activite.chantierId,
      activiteId: activite.id,
      libelle: activite.libelle,
      forme: (activite.forme ?? 'ACTIVITE') as ActiviteForme,
      natureCode: activite.natureCode ?? '',
      dateDebut: activite.dateDebut,
      dateFin: activite.dateFin,
      dureeMinutesOuvrees: activite.dureeMinutesOuvrees ?? null,
      calendrierSpecifique: activite.calendrierSpecifique ?? null,
      parentActiviteId: activite.parentActiviteId ?? '',
      zoneId: activite.zoneId ?? '',
    });
    await this.ensureDrawerRefs(activite.chantierId);
  }

  async saveDraft(): Promise<{ ok: boolean; message?: string }> {
    const draft = this.draft();
    if (!draft) {
      return { ok: false, message: 'Rien à enregistrer' };
    }
    if (!draft.libelle.trim() || !draft.dateDebut) {
      this.drawerError.set('Libellé et début sont requis.');
      return { ok: false, message: 'Libellé et début sont requis.' };
    }
    if (draft.forme === 'ACTIVITE' && (draft.dureeMinutesOuvrees == null || draft.dureeMinutesOuvrees <= 0) && !draft.dateFin) {
      this.drawerError.set('Indiquez une durée ouvrée.');
      return { ok: false, message: 'Indiquez une durée ouvrée.' };
    }
    this.saving.set(true);
    this.drawerError.set(null);
    try {
      const resumed = this.activites().find(a=>a.id===draft.activiteId)?.planningRemainder;
      const body = {
        ...this.toWriteBody(draft),
        recalculerFin: !resumed && draft.forme === 'ACTIVITE' && draft.dureeMinutesOuvrees != null,
        ...(resumed ? {dateFin:draft.dateFin} : {}),
        ...(this.capacites().administrerCalendrier ? {
          calendrierSpecifique: draft.calendrierSpecifique ?? undefined,
          utiliserCalendrierChantier: !draft.calendrierSpecifique,
        } : {}),
      };
      if (this.drawerMode() === 'create') {
        const created = await this.activiteApi.createActivite(draft.chantierId, body);
        await this.reloadChantier(draft.chantierId);
        this.periodPreset.set('ALL');
        await this.openActivite(created.id);
      } else if (draft.activiteId) {
        await this.activiteApi.updateActivite(draft.chantierId, draft.activiteId, body);
        await this.reloadChantier(draft.chantierId);
        await this.openActivite(draft.activiteId);
      }
      return { ok: true };
    } catch (error) {
      const message = readApiMessage(error);
      this.drawerError.set(message);
      return { ok: false, message };
    } finally {
      this.saving.set(false);
    }
  }

  async simulateNetwork(): Promise<void> {
    const id = this.summary().monoChantier?.id;
    if (!id || this.simulating()) return;
    this.simulating.set(true); this.simulationError.set(''); this.simulation.set(null);
    try { const result = await this.activiteApi.simulateNetwork(id);
      if (this.summary().monoChantier?.id === id) this.simulation.set(result);
    } catch (error) { this.simulationError.set(readApiMessage(error)); }
    finally { this.simulating.set(false); }
  }
  async applyNetwork(): Promise<void> {
    const id = this.summary().monoChantier?.id, result = this.simulation();
    if (!id || !result || this.simulating()) return;
    this.simulating.set(true); this.simulationError.set('');
    try { await this.activiteApi.applyNetwork(id, result.token); await this.reloadChantier(id); this.simulation.set(null); }
    catch (error) { this.simulationError.set(readApiMessage(error)); }
    finally { this.simulating.set(false); }
  }

  async changePrecedence(predId: string, type: import('../../services/activite-api.service').PrecedenceType, removeId?: string): Promise<boolean> {
    const draft = this.draft();
    if (!draft?.activiteId || this.saving()) return false;
    this.saving.set(true);
    this.drawerError.set(null);
    try {
      if (removeId) await this.activiteApi.removePrecedence(draft.chantierId, removeId);
      else await this.activiteApi.addPrecedence(draft.chantierId, predId, draft.activiteId, type);
      await this.reloadChantier(draft.chantierId);
      return true;
    } catch (error) {
      this.drawerError.set(readApiMessage(error));
      return false;
    } finally { this.saving.set(false); }
  }

  async rattacherNoeud(noeudId: string, quantitePrevue: number): Promise<{ ok: boolean; message?: string }> {
    const draft = this.draft();
    const option = this.noeudOptions().find((n) => n.id === noeudId);
    if (!draft?.activiteId || !option) {
      return { ok: false, message: 'Choisissez un poste dans l’arbre.' };
    }
    if (!(quantitePrevue > 0)) {
      return { ok: false, message: 'Indiquez une quantité prévue.' };
    }
    if (quantitePrevue - option.reste > 1e-9) {
      const unite = option.unite ? ` ${option.unite}` : '';
      const message = `Reste ${option.reste}${unite} sur ${option.code} ${option.designation} — pas assez pour ${quantitePrevue}.`;
      this.drawerError.set(message);
      return { ok: false, message };
    }
    this.saving.set(true);
    this.drawerError.set(null);
    try {
      const body = option.type === 'POSTE'
        ? { posteId: option.id, quantitePrevue }
        : { lotId: option.id, quantitePrevue };
      await this.activiteApi.rattacher(draft.chantierId, draft.activiteId, body);
      await this.reloadChantier(draft.chantierId);
      await this.openActivite(draft.activiteId);
      return { ok: true };
    } catch (error) {
      const raw = readApiMessage(error);
      const message = messageDepassementPoste(raw) ?? raw;
      this.drawerError.set(message);
      return { ok: false, message };
    } finally {
      this.saving.set(false);
    }
  }

  async detacher(rattachementId: string): Promise<{ ok: boolean; message?: string }> {
    const draft = this.draft();
    if (!draft?.activiteId) {
      return { ok: false };
    }
    this.saving.set(true);
    this.drawerError.set(null);
    try {
      await this.activiteApi.detacher(draft.chantierId, draft.activiteId, rattachementId);
      await this.reloadChantier(draft.chantierId);
      await this.openActivite(draft.activiteId);
      return { ok: true };
    } catch (error) {
      const message = readApiMessage(error);
      this.drawerError.set(message);
      return { ok: false, message };
    } finally {
      this.saving.set(false);
    }
  }

  async declarerAvancement(input: {
    date: string;
    quantiteRealisee?: number;
    avancementPercent?: number;
    rattachementId?: string;
  }): Promise<{ ok: boolean; message?: string }> {
    const draft = this.draft();
    if (!draft?.activiteId) {
      return { ok: false };
    }
    this.saving.set(true);
    this.drawerError.set(null);
    try {
      const user = this.auth.user();
      await this.activiteApi.declarerAvancement(draft.chantierId, draft.activiteId, {
        date: input.date,
        quantiteRealisee: input.quantiteRealisee,
        avancementPercent: input.avancementPercent,
        rattachementId: input.rattachementId,
        saisieParId: user?.id ?? 'qa',
        saisieParName: this.auth.displayName() || 'QA',
        status: 'BROUILLON',
      });
      await this.reloadChantier(draft.chantierId);
      await this.openActivite(draft.activiteId);
      return { ok: true };
    } catch (error) {
      const message = readApiMessage(error);
      this.drawerError.set(message);
      return { ok: false, message };
    } finally {
      this.saving.set(false);
    }
  }

  async updateActiviteDates(id: string, startDate: Date, endDate: Date): Promise<{ ok: boolean; message?: string }> {
    const activite = this.activites().find((a) => a.id === id);
    if (!activite) {
      return { ok: false, message: 'Activité introuvable' };
    }
    const dateDebut = toIsoDate(startDate);
    const dateFin = toIsoDate(endDate);
    try {
      const updated = await this.activiteApi.updateDates(activite.chantierId, id, dateDebut, dateFin);
      this._activites.update((items) => items.map((a) => (a.id === id ? { ...a, ...updated, dateDebut, dateFin } : a)));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: readApiMessage(e) };
    }
  }

  rattachementLabel(rattachement: { posteId?: string; lotId?: string; quantitePrevue: number }): string {
    const draft = this.draft();
    const arbre = draft ? this._arbres()[draft.chantierId] : undefined;
    const id = rattachement.posteId || rattachement.lotId;
    const node = id ? flattenNoeuds(arbre?.lots).find((n) => n.id === id) : undefined;
    const code = node ? `${node.code} ${node.designation}` : 'Poste';
    const unite = node?.unite ? ` ${node.unite}` : '';
    const prevue = Number(node?.quantitePrevue ?? 0);
    const alloue = id ? (this.quantiteAlloueeParNoeud().get(id) ?? 0) : 0;
    const reste = Math.max(0, prevue - alloue);
    return `${code} · ${rattachement.quantitePrevue}${unite} / ${prevue}${unite} restants ${reste}${unite}`;
  }

  patchForme(forme: ActiviteForme): void {
    const hours = this.calendarContext().heuresParJour || 8;
    this.draft.update((current) => {
      if (!current) {
        return current;
      }
      const natureOk = PLANNING_NATURES.some(
        (n) => n.code === current.natureCode && (forme === 'JALON' ? n.forme === 'JALON' : n.forme === 'ACTIVITE'),
      );
      return {
        ...current,
        forme,
        natureCode: natureOk ? current.natureCode : '',
        dateFin: forme === 'JALON' ? current.dateDebut : current.dateFin,
        dureeMinutesOuvrees: forme === 'JALON' ? 0 : forme === 'PHASE' ? null : current.dureeMinutesOuvrees ?? Math.round(hours * 60),
      };
    });
  }

  openCalendar(scope: 'chantier' | 'activite' = 'chantier'): void {
    this.simulation.set(null);
    this.calendarScope.set(scope);
    this.calendarOpen.set(true);
    this.calendarError.set(null);
  }

  closeCalendar(): void {
    this.calendarOpen.set(false);
    this.calendarError.set(null);
  }

  async saveCalendar(body: CalendrierVersionWrite): Promise<{ ok: boolean; message?: string }> {
    const mono = this.summary().monoChantier;
    if (!mono) {
      return { ok: false, message: 'Filtrez un chantier.' };
    }
    if (!this.capacites().administrerCalendrier) {
      return { ok: false, message: 'Vous pouvez consulter le calendrier, pas l’administrer.' };
    }
    if (this.calendarScope() === 'activite') {
      const { dateEffet, ...specific } = body;
      this.patchDraft({ calendrierSpecifique: specific });
      return { ok: true };
    }
    this.saving.set(true);
    this.calendarError.set(null);
    try {
      const saved = await this.activiteApi.putCalendrier(mono.id, body);
      this._calendrier.set(saved);
      return { ok: true };
    } catch (error) {
      const message = readApiMessage(error);
      this.calendarError.set(message);
      return { ok: false, message };
    } finally {
      this.saving.set(false);
    }
  }

  toggleViews(): void {
    this.viewsOpen.update((open) => !open);
  }

  saveCurrentView(name: string): { ok: boolean; message?: string } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, message: 'Nommez la vue.' };
    }
    if (!this.capacites().gererVues) {
      return { ok: false, message: 'Vous ne pouvez pas gérer les vues.' };
    }
    const view: PlanningSavedView = {
      id: `vue-${Date.now().toString(36)}`,
      name: trimmed,
      chantierIds: [...this.selectedChantierIds()],
      periodPreset: this.periodPreset(),
      granularity: this.granularity(),
      legendFilter: [...this.legendFilter()],
      natureFilter: this.natureFilter(),
      columns: [...this.visibleColumns()],
      showLinks: this.showLinks(),
      grouping: this.grouping(),
      sort: this.sort(),
    };
    this._savedViews.update((list) => [...list.filter((v) => v.name !== trimmed), view]);
    this.persistViews();
    return { ok: true };
  }

  applyView(id: string): void {
    const view = this._savedViews().find((v) => v.id === id);
    if (!view) {
      return;
    }
    this.periodPreset.set(view.periodPreset);
    this.granularity.set(view.granularity);
    this.legendFilter.set([...view.legendFilter]);
    this.natureFilter.set(view.natureFilter);
    this.visibleColumns.set(view.columns.length ? [...view.columns] : [...DEFAULT_PLANNING_COLUMNS]);
    this.showLinks.set(view.showLinks ?? true);
    this.grouping.set(view.grouping);
    this.sort.set(view.sort);
    this.customRange.set(null);
    if (view.chantierIds.length) {
      this.selectedChantierIds.set([...view.chantierIds]);
      void this.loadAll();
    }
  }

  deleteView(id: string): void {
    this._savedViews.update((list) => list.filter((v) => v.id !== id));
    this.persistViews();
  }

  snapshotView(): PlanningSavedView {
    return {
      id: '',
      name: '',
      chantierIds: [...this.selectedChantierIds()],
      periodPreset: this.periodPreset(),
      granularity: this.granularity(),
      legendFilter: [...this.legendFilter()],
      natureFilter: this.natureFilter(),
      columns: [...this.visibleColumns()],
      showLinks: this.showLinks(),
      grouping: this.grouping(),
      sort: this.sort(),
    };
  }

  private formatPredecessors(preds: ActivitePrecedence[]): string {
    if (!preds.length) {
      return '—';
    }
    return preds
      .map((p) => {
        const pred = this.activites().find((a) => a.id === p.predActiviteId);
        const label = pred?.code || pred?.libelle || '…';
        return `${label} · ${p.typeLien}`;
      })
      .join(', ');
  }

  private toWriteBody(draft: ActiviteDraft) {
    if (draft.forme === 'JALON') {
      return {
        libelle: draft.libelle.trim(),
        forme: 'JALON' as const,
        natureCode: draft.natureCode || null,
        dateDebut: draft.dateDebut,
        dateFin: draft.dateDebut,
        dureeMinutesOuvrees: 0,
        parentActiviteId: draft.parentActiviteId || null,
        zoneId: draft.zoneId || null,
      };
    }
    if (draft.forme === 'PHASE') {
      return {
        libelle: draft.libelle.trim(),
        forme: 'PHASE' as const,
        natureCode: draft.natureCode || null,
        dateDebut: draft.dateDebut,
        dateFin: draft.dateFin || draft.dateDebut,
        parentActiviteId: draft.parentActiviteId || null,
        zoneId: draft.zoneId || null,
      };
    }
    return {
      libelle: draft.libelle.trim(),
      forme: 'ACTIVITE' as const,
      natureCode: draft.natureCode || null,
      dateDebut: draft.dateDebut,
      dureeMinutesOuvrees: draft.dureeMinutesOuvrees,
      parentActiviteId: draft.parentActiviteId || null,
      zoneId: draft.zoneId || null,
    };
  }

  private async refreshCalendrier(chantierId: string | null): Promise<void> {
    if (!chantierId) {
      this._calendrier.set(null);
      return;
    }
    try {
      this._calendrier.set(await this.activiteApi.getCalendrier(chantierId));
    } catch (error) {
      if (httpStatus(error) === 403) {
        this._calendrier.set(null);
        return;
      }
      this._calendrier.set(null);
    }
  }

  private hydrateViews(): void {
    try {
      const raw = localStorage.getItem(this.viewsKey());
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as PlanningSavedView[];
      if (Array.isArray(parsed)) {
        this._savedViews.set(parsed);
      }
    } catch {
      this._savedViews.set([]);
    }
  }

  private persistViews(): void {
    localStorage.setItem(this.viewsKey(), JSON.stringify(this._savedViews()));
  }

  private viewsKey(): string {
    return viewsStorageKey(this.auth.currentTenant()?.tenant.id, this.auth.user()?.id);
  }

  private quantiteAlloueeParNoeud(): Map<string, number> {
    const map = new Map<string, number>();
    for (const activite of this.activites()) {
      for (const ratt of activite.rattachements ?? []) {
        const id = ratt.posteId || ratt.lotId;
        if (!id) {
          continue;
        }
        map.set(id, (map.get(id) ?? 0) + Number(ratt.quantitePrevue ?? 0));
      }
    }
    return map;
  }

  private async ensureDrawerRefs(chantierId: string): Promise<void> {
    await Promise.all([this.ensureZones(chantierId), this.ensureArbre(chantierId)]);
  }

  private async ensureZones(chantierId: string): Promise<void> {
    if (this._zonesByChantier()[chantierId]) {
      return;
    }
    try {
      const zones = await this.activiteApi.listZones(chantierId);
      this._zonesByChantier.update((current) => ({ ...current, [chantierId]: zones }));
    } catch {
      this._zonesByChantier.update((current) => ({ ...current, [chantierId]: [] }));
    }
  }

  private async ensureArbre(chantierId: string): Promise<void> {
    if (this._arbres()[chantierId]) {
      return;
    }
    try {
      const arbre = await this.budgetApi.getArbre(chantierId);
      this._arbres.update((current) => ({ ...current, [chantierId]: arbre }));
    } catch {
      // picker vide si l'arbre n'est pas lisible
    }
  }

  async reloadChantier(chantierId: string): Promise<void> {
    this.simulation.set(null);
    const planning = await this.activiteApi.planning(chantierId);
    this._activites.update((items) => [
      ...items.filter((a) => a.chantierId !== chantierId),
      ...(planning.activites ?? []),
    ]);
    this._precedences.update((items) => [
      ...items.filter((p) => p.chantierId !== chantierId),
      ...(planning.precedences ?? []),
    ]);
    this._arbres.update((current) => {
      const next = { ...current };
      delete next[chantierId];
      return next;
    });
    await this.ensureArbre(chantierId);
  }
}
