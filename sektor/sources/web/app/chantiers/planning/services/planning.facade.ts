import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthFacade } from '@platform/core/security/services/auth.facade';

import { BudgetApiService } from '../../budget/services/budget-api.service';
import type { BudgetArbre, BudgetNoeud } from '../../budget/models/budget.model';
import { ChantierApiService } from '../../services/chantier-api.service';
import {
  ActiviteApiService,
  type ActiviteChantier,
  type ActivitePrecedence,
  type ActiviteStatus,
  type ZoneChantier,
} from '../../services/activite-api.service';
import type { Chantier, PlanningGranularity, PlanningPeriodPreset } from '../../models';

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

export interface ActiviteDraft {
  chantierId: string;
  activiteId?: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  parentActiviteId: string;
  zoneId: string;
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
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly drawerError = signal<string | null>(null);

  readonly selectedChantierIds = signal<string[]>([]);
  readonly granularity = signal<PlanningGranularity>('WEEK');
  readonly periodPreset = signal<PlanningPeriodPreset>('THIS_QUARTER');
  readonly selectedActiviteId = signal<string | null>(null);
  readonly selectedTaskId = signal<string | null>(null);
  readonly legendFilter = signal<ActiviteStatus[]>([]);
  readonly customRange = signal<PlanningRange | null>(null);
  readonly drawerMode = signal<PlanningDrawerMode | null>(null);
  readonly draft = signal<ActiviteDraft | null>(null);

  readonly chantiers = computed(() => this._chantiers().filter((chantier) => chantier.isActive));
  readonly activites = computed(() => this._activites());

  constructor() {
    void this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const { items } = await this.chantierApi.getAll({ page: 1, pageSize: 500 });
      const active = items.filter((c) => c.isActive);
      this._chantiers.set(active);

      const activites: ActiviteChantier[] = [];
      const precedences: ActivitePrecedence[] = [];
      await Promise.all(
        active.map(async (chantier) => {
          try {
            const planning = await this.activiteApi.planning(chantier.id);
            activites.push(...(planning.activites ?? []));
            precedences.push(...(planning.precedences ?? []));
          } catch {
            // chantier sans endpoint / erreur → skip
          }
        }),
      );
      this._activites.set(activites);
      this._precedences.set(precedences);
    } catch {
      this._chantiers.set([]);
      this._activites.set([]);
      this._precedences.set([]);
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
    const selected = this.activites().filter((a) =>
      this.selectedChantiers().some((c) => c.id === a.chantierId),
    );
    const allDates = selected.flatMap((a) => [parseDate(a.dateDebut), parseDate(a.dateFin)]);
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

  readonly visibleActivites = computed(() => {
    const selectedIds = new Set(this.selectedChantiers().map((c) => c.id));
    const legend = this.legendFilter();
    const range = this.effectiveRange();
    return this.activites()
      .filter((a) => selectedIds.has(a.chantierId))
      .filter((a) => overlapsRange(a, range))
      .filter((a) => !legend.length || legend.includes(a.status))
      .sort((left, right) => left.ordre - right.ordre || parseDate(left.dateDebut).getTime() - parseDate(right.dateDebut).getTime());
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
        });
      }

      for (const activite of chantierActivites) {
        const parentFromWbs = activite.parentActiviteId && visibleIds.has(activite.parentActiviteId)
          ? activite.parentActiviteId
          : null;
        const parent = parentFromWbs ?? (mono ? ROOT_TASK_ID : chantier.id);
        tasks.push({
          id: activite.id,
          text: activite.libelle,
          start_date: parseDate(activite.dateDebut),
          end_date: endExclusive(activite.dateFin),
          progress: Number(activite.avancementPercent ?? 0) / 100,
          parent,
          open: true,
          readonly: false,
          recordType: 'ACTIVITE',
          status: activite.status,
          chantierId: chantier.id,
          activiteId: activite.id,
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

  async openCreate(): Promise<{ ok: boolean; message?: string }> {
    const mono = this.summary().monoChantier;
    if (!mono) {
      return { ok: false, message: 'Filtrez un chantier pour créer une activité.' };
    }
    const today = toIsoDate(new Date());
    this.drawerError.set(null);
    this.selectedActiviteId.set(null);
    this.drawerMode.set('create');
    this.draft.set({
      chantierId: mono.id,
      libelle: '',
      dateDebut: today,
      dateFin: plusDays(today, 10),
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
      dateDebut: activite.dateDebut,
      dateFin: activite.dateFin,
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
    if (!draft.libelle.trim() || !draft.dateDebut || !draft.dateFin) {
      return { ok: false, message: 'Libellé et dates sont requis.' };
    }
    this.saving.set(true);
    this.drawerError.set(null);
    try {
      const body = {
        libelle: draft.libelle.trim(),
        dateDebut: draft.dateDebut,
        dateFin: draft.dateFin,
        parentActiviteId: draft.parentActiviteId || null,
        zoneId: draft.zoneId || null,
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

  private async reloadChantier(chantierId: string): Promise<void> {
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
