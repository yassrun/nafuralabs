import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import { AvancementApiService } from './avancement-api.service';
import { AvancementContextService } from './avancement-context.service';
import { AvancementCalculService } from './avancement-calcul.service';
import type {
  AvancementListItem,
  AvancementPersistInput,
  AvancementQuery,
  AvancementSaisieSummary,
  AvancementStatus,
  LotSaisieDraft,
  SaisieLineDefinition,
  SaisieLineViewModel,
} from '../models';
import {
  avancementProgressKey,
  mapDernierAvancementsByLineKey,
  parseSaisieLineKey,
  saisieLineKey,
} from '../utils/saisie-line.util';

export type LoadSaisieContextResult = 'ok' | 'edit-not-found' | 'chantier-not-found';

@Injectable({ providedIn: 'root' })
export class AvancementFacade extends GridFacade<
  AvancementListItem,
  AvancementPersistInput,
  Partial<AvancementPersistInput>,
  AvancementQuery
> {
  protected override api = inject(AvancementApiService);
  private readonly context = inject(AvancementContextService);
  private readonly audit = inject(ErpAuditService);
  private readonly calcul = inject(AvancementCalculService);
  private readonly translate = inject(TranslateService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  readonly currentUser = computed(() => this.context.getCurrentUser());
  readonly chantiers = computed(() => this.context.getChantiers());
  readonly employees = computed(() => this.context.getEmployees());

  readonly selectedChantierId = signal<string | null>(null);
  readonly selectedDate = signal<string>(todayIso());
  readonly editingAvancementId = signal<string | null>(null);

  private readonly draftByLineKey = signal<Record<string, LotSaisieDraft>>({});
  private readonly selectedLineKeys = signal<string[]>([]);
  private readonly dernierByLineKey = signal<Record<string, AvancementListItem>>({});

  readonly chantier = computed(() => {
    const chantierId = this.selectedChantierId();
    return chantierId ? this.chantiers().find((item) => item.id === chantierId) ?? null : null;
  });

  readonly allSaisieLines = computed(() => {
    const chantierId = this.selectedChantierId();
    return chantierId ? this.context.getSaisieLines(chantierId) : [];
  });

  readonly availableAdditionalLines = computed(() =>
    this.allSaisieLines().filter((line) => !this.selectedLineKeys().includes(line.key)),
  );

  readonly selectedLines = computed((): SaisieLineViewModel[] => {
    const drafts = this.draftByLineKey();
    const dernier = this.dernierByLineKey();
    const lineByKey = new Map(this.allSaisieLines().map((line) => [line.key, line]));
    const items: SaisieLineViewModel[] = [];

    for (const lineKey of this.selectedLineKeys()) {
      const definition = lineByKey.get(lineKey);
      if (!definition) continue;

      const draft = drafts[lineKey] ?? {
        lineKey,
        lotId: definition.lot.id,
        posteId: definition.poste?.id,
        quantitePeriode: null,
        notes: '',
        photos: [],
      };

      const progressKey = avancementProgressKey(
        definition.lot.id,
        definition.poste?.id,
      );
      const last = dernier[progressKey];
      const quantiteReference = definition.kind === 'poste'
        ? definition.poste!.quantite
        : definition.lot.quantite;
      const unite = definition.kind === 'poste'
        ? definition.poste!.unite
        : definition.lot.unite;

      const row = this.calcul.buildRow(
        {
          quantite: quantiteReference,
          cumulQuantite: last?.cumulQuantite ?? 0,
          avancementPercent: last?.pourcentage ?? 0,
          unite,
        },
        draft.quantitePeriode,
      );

      items.push({
        lineKey,
        kind: definition.kind,
        lot: definition.lot,
        poste: definition.poste,
        parentLot: definition.parentLot,
        breadcrumb: this.buildBreadcrumb(definition),
        unite,
        quantiteReference,
        lastCumul: row.lastCumul,
        quantitePeriode: draft.quantitePeriode,
        nouveauCumul: row.nouveauCumul,
        previousPercent: row.previousPercent,
        newPercent: row.newPercent,
        deltaPercent: row.deltaPercent,
        warning: row.warningKey
          ? this.translate.instant(`chantiers.avancement.warnings.${row.warningKey}`, row.warningParams)
          : undefined,
        notes: draft.notes,
        photos: draft.photos,
      });
    }

    return items;
  });

  readonly summary = computed<AvancementSaisieSummary>(() => {
    const lines = this.allSaisieLines();
    if (lines.length === 0) {
      return {
        lotsCount: 0,
        chantierBeforePercent: 0,
        chantierAfterPercent: 0,
        chantierDeltaPercent: 0,
      };
    }

    const selectedMap = new Map(this.selectedLines().map((item) => [item.lineKey, item]));
    const totalWeight = lines.reduce((sum, line) => sum + Math.max(line.weight, 0), 0);

    const weightedPercent = (picker: (line: SaisieLineDefinition, selected?: SaisieLineViewModel) => number) => {
      if (totalWeight <= 0) return 0;
      return lines.reduce((sum, line) => {
        const selected = selectedMap.get(line.key);
        const percent = picker(line, selected);
        return sum + Math.max(line.weight, 0) * percent;
      }, 0) / totalWeight;
    };

    const before = weightedPercent((line) => {
      const progressKey = avancementProgressKey(line.lot.id, line.poste?.id);
      return this.dernierByLineKey()[progressKey]?.pourcentage ?? 0;
    });
    const after = weightedPercent((line, selected) => {
      const progressKey = avancementProgressKey(line.lot.id, line.poste?.id);
      const previous = this.dernierByLineKey()[progressKey]?.pourcentage ?? 0;
      return selected?.newPercent ?? previous;
    });
    const linesCount = this.selectedLines().filter(
      (item) => item.quantitePeriode != null && item.quantitePeriode > 0,
    ).length;

    return {
      lotsCount: linesCount,
      chantierBeforePercent: this.calcul.round(before),
      chantierAfterPercent: this.calcul.round(after),
      chantierDeltaPercent: this.calcul.round(after - before),
    };
  });

  override async ensureLookups(): Promise<void> {
    await this.context.ensureBaseData();
    this.lookupsSignal.set({
      chantiers: this.chantiers().map((chantier) => ({
        key: chantier.id,
        value: `${chantier.code} - ${chantier.name}`,
      })),
      lots: this.context.getLots().map((lot) => ({
        key: lot.id,
        value: `${lot.code} - ${lot.designation}`,
      })),
      employees: this.employees().map((employee) => ({
        key: employee.id,
        value: employee.name,
      })),
    });
  }

  async loadSaisieContext(
    chantierId?: string | null,
    editId?: string | null,
  ): Promise<LoadSaisieContextResult> {
    await this.context.ensureBaseData();
    await this.ensureLookups();
    this.editingAvancementId.set(null);

    if (editId) {
      const item = await this.api.findById(editId);
      if (!item) {
        return 'edit-not-found';
      }

      this.editingAvancementId.set(editId);
      this.selectedChantierId.set(item.chantierId);
      this.selectedDate.set(item.date);
      await this.loadDernierAvancements(item.chantierId);
      await this.context.loadLotsForChantier(item.chantierId, this.legacyDernierByLotId());

      const lineKey = item.posteId
        ? saisieLineKey('poste', item.posteId)
        : saisieLineKey('lot', item.lotId);
      this.selectedLineKeys.set([lineKey]);
      this.draftByLineKey.set({
        [lineKey]: {
          lineKey,
          lotId: item.lotId,
          posteId: item.posteId,
          quantitePeriode: item.quantiteRealisee,
          notes: item.notes ?? '',
          photos: item.photos,
        },
      });
      return 'ok';
    }

    if (chantierId) {
      const exists = this.chantiers().some((chantier) => chantier.id === chantierId);
      if (!exists) {
        return 'chantier-not-found';
      }
      this.selectChantier(chantierId);
      this.selectedDate.set(todayIso());
      return 'ok';
    }

    const fallbackChantierId = this.currentUser().preferredChantierIds.find((id) => this.chantiers().some((chantier) => chantier.id === id))
      ?? this.chantiers().find((item) => item.status === 'EN_COURS')?.id
      ?? null;

    this.selectChantier(fallbackChantierId);
    this.selectedDate.set(todayIso());
    return 'ok';
  }

  async getDernierAvancements(chantierId: string): Promise<AvancementListItem[]> {
    return this.api.getDernierByChantier(chantierId);
  }

  selectChantier(chantierId: string | null): void {
    this.selectedChantierId.set(chantierId);
    if (!chantierId) {
      this.selectedLineKeys.set([]);
      this.draftByLineKey.set({});
      this.dernierByLineKey.set({});
      return;
    }

    void this.loadLinesAndDefaults(chantierId);
  }

  private async loadLinesAndDefaults(chantierId: string): Promise<void> {
    await this.loadDernierAvancements(chantierId);
    await this.context.loadLotsForChantier(chantierId, this.legacyDernierByLotId());
    const defaultLines = this.context.getActiveSaisieLines(chantierId).slice(0, 6);
    this.selectedLineKeys.set(defaultLines.map((line) => line.key));
    this.draftByLineKey.set(
      defaultLines.reduce<Record<string, LotSaisieDraft>>((accumulator, line) => {
        accumulator[line.key] = {
          lineKey: line.key,
          lotId: line.lot.id,
          posteId: line.poste?.id,
          quantitePeriode: null,
          notes: '',
          photos: [],
        };
        return accumulator;
      }, {}),
    );
  }

  setDate(date: string): void {
    this.selectedDate.set(date);
  }

  addLine(lineKey: string): void {
    if (this.selectedLineKeys().includes(lineKey)) {
      return;
    }

    const definition = this.allSaisieLines().find((line) => line.key === lineKey);
    if (!definition) return;

    this.selectedLineKeys.update((keys) => [...keys, lineKey]);
    this.draftByLineKey.update((drafts) => ({
      ...drafts,
      [lineKey]: drafts[lineKey] ?? {
        lineKey,
        lotId: definition.lot.id,
        posteId: definition.poste?.id,
        quantitePeriode: null,
        notes: '',
        photos: [],
      },
    }));
  }

  removeLine(lineKey: string): void {
    this.selectedLineKeys.update((keys) => keys.filter((key) => key !== lineKey));
    this.draftByLineKey.update((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[lineKey];
      return nextDrafts;
    });
  }

  setLineQuantity(lineKey: string, value: number | null): void {
    this.patchDraft(lineKey, { quantitePeriode: value != null && !Number.isNaN(value) ? value : null });
  }

  setLineNotes(lineKey: string, notes: string): void {
    this.patchDraft(lineKey, { notes });
  }

  setLinePhotos(lineKey: string, photos: LotSaisieDraft['photos']): void {
    this.patchDraft(lineKey, { photos });
  }

  canEditItem(item: AvancementListItem): boolean {
    return this.context.canEdit(item);
  }

  async saveDraft(): Promise<number> {
    return this.persist('BROUILLON');
  }

  async validate(): Promise<number> {
    return this.persist('VALIDE');
  }

  override async deleteItem(id: string): Promise<void> {
    await this.api.delete(id);
    this.audit.log('DELETE', 'AVANCEMENT', id, id, 'Avancement supprimé');
  }

  private async persist(status: AvancementStatus): Promise<number> {
    const chantierId = this.selectedChantierId();
    if (!chantierId) {
      throw new Error(this.translate.instant('chantiers.avancement.errors.chooseChantier'));
    }

    const entries = this.selectedLines()
      .filter((item) => item.quantitePeriode != null && item.quantitePeriode > 0)
      .map((item) => ({
        lotId: item.lot.id,
        posteId: item.poste?.id,
        quantiteRealisee: item.quantitePeriode!,
        notes: item.notes,
        photos: item.photos,
      }));

    if (entries.length === 0) {
      throw new Error(this.translate.instant('chantiers.avancement.errors.atLeastOnePositiveQty'));
    }

    const editingId = this.editingAvancementId();
    const action = status === 'VALIDE' ? 'APPROVE' : 'UPDATE';
    const chantier = this.chantier();
    const ref = chantier ? `${chantier.code}` : chantierId;
    if (editingId) {
      if (entries.length !== 1) {
        throw new Error(this.translate.instant('chantiers.avancement.errors.v1SingleLine'));
      }

      await this.api.update(editingId, {
        date: this.selectedDate(),
        quantiteRealisee: entries[0].quantiteRealisee,
        notes: entries[0].notes,
        photos: entries[0].photos,
        status: status === 'VALIDE' ? undefined : 'BROUILLON',
      });
      if (status === 'VALIDE') {
        await this.api.valider(editingId);
      }
      this.audit.log(action, 'AVANCEMENT', editingId, ref,
        `1 ligne modifiée (${this.selectedDate()}) → ${status}`);
      this.editingAvancementId.set(null);
    } else {
      await this.api.create({
        chantierId,
        date: this.selectedDate(),
        status,
        saisieParId: this.currentUser().id,
        entries,
      });
      this.audit.log(action === 'APPROVE' ? 'APPROVE' : 'CREATE', 'AVANCEMENT',
        chantierId, ref, `${entries.length} ligne(s) (${this.selectedDate()}) → ${status}`);
    }

    this.selectChantier(chantierId);
    this.selectedDate.set(todayIso());
    await this.loadDernierAvancements(chantierId);
    return entries.length;
  }

  private patchDraft(lineKey: string, patch: Partial<LotSaisieDraft>): void {
    const parsed = parseSaisieLineKey(lineKey);
    this.draftByLineKey.update((drafts) => ({
      ...drafts,
      [lineKey]: {
        ...drafts[lineKey],
        lineKey,
        lotId: drafts[lineKey]?.lotId ?? parsed.id,
        posteId: drafts[lineKey]?.posteId,
        quantitePeriode: drafts[lineKey]?.quantitePeriode ?? null,
        notes: drafts[lineKey]?.notes ?? '',
        photos: drafts[lineKey]?.photos ?? [],
        ...patch,
      },
    }));
  }

  private buildBreadcrumb(definition: SaisieLineDefinition): string {
    const parts: string[] = [];
    if (definition.parentLot) {
      parts.push(definition.parentLot.code);
    }
    parts.push(definition.lot.code);
    if (definition.poste) {
      parts.push(`${definition.poste.code} ${definition.poste.designation}`);
    } else {
      parts.push(definition.lot.designation);
    }
    return parts.join(' › ');
  }

  private legacyDernierByLotId(): Record<string, AvancementListItem> {
    return Object.values(this.dernierByLineKey()).reduce<Record<string, AvancementListItem>>((acc, item) => {
      if (item.lotId && !acc[item.lotId]) {
        acc[item.lotId] = item;
      }
      return acc;
    }, {});
  }

  private async loadDernierAvancements(chantierId: string): Promise<void> {
    try {
      const items = await this.api.getDernierByChantier(chantierId);
      this.dernierByLineKey.set(mapDernierAvancementsByLineKey(items));
    } catch {
      this.dernierByLineKey.set({});
    }
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
