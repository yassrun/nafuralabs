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
  LotSaisieViewModel,
} from '../models';

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

  private readonly draftByLotId = signal<Record<string, LotSaisieDraft>>({});
  private readonly selectedLotIds = signal<string[]>([]);
  private readonly dernierByLotId = signal<Record<string, AvancementListItem>>({});

  readonly chantier = computed(() => {
    const chantierId = this.selectedChantierId();
    return chantierId ? this.chantiers().find((item) => item.id === chantierId) ?? null : null;
  });

  readonly chantierLots = computed(() => {
    const chantierId = this.selectedChantierId();
    return chantierId ? this.context.getLots(chantierId) : [];
  });

  readonly availableAdditionalLots = computed(() =>
    this.chantierLots().filter((lot) => !this.selectedLotIds().includes(lot.id)),
  );

  readonly selectedLots = computed(() => {
    const drafts = this.draftByLotId();
    const items = this.selectedLotIds()
      .map((lotId) => {
        const lot = this.chantierLots().find((item) => item.id === lotId);
        if (!lot) {
          return null;
        }

        const draft = drafts[lotId] ?? {
          lotId,
          quantitePeriode: null,
          notes: '',
          photos: [],
        };
        const quantitePeriode = draft.quantitePeriode;
        const dernier = this.dernierByLotId()[lotId];
        const row = this.calcul.buildRow(
          {
            quantite: lot.quantite,
            cumulQuantite: dernier?.cumulQuantite ?? lot.cumulQuantite,
            avancementPercent: dernier?.pourcentage ?? lot.avancementPercent,
            unite: lot.unite,
          },
          quantitePeriode,
        );

        return {
          lot,
          lastCumul: row.lastCumul,
          quantitePeriode,
          nouveauCumul: row.nouveauCumul,
          previousPercent: row.previousPercent,
          newPercent: row.newPercent,
          deltaPercent: row.deltaPercent,
          warning: row.warningKey
            ? this.translate.instant(`chantiers.avancement.warnings.${row.warningKey}`, row.warningParams)
            : undefined,
          notes: draft.notes,
          photos: draft.photos,
        };
      })
      .filter((item): item is Exclude<typeof item, null> => item !== null);

    return items as LotSaisieViewModel[];
  });

  readonly summary = computed<AvancementSaisieSummary>(() => {
    const chantier = this.chantier();
    const lots = this.chantierLots();
    if (!chantier || lots.length === 0) {
      return {
        lotsCount: 0,
        chantierBeforePercent: 0,
        chantierAfterPercent: 0,
        chantierDeltaPercent: 0,
      };
    }

    const selectedMap = new Map(this.selectedLots().map((item) => [item.lot.id, item]));
    const totalQuantite = lots.reduce((sum, lot) => sum + lot.quantite, 0);
    const before = totalQuantite > 0
      ? lots.reduce((sum, lot) => sum + lot.quantite * lot.avancementPercent, 0) / totalQuantite
      : 0;
    const after = totalQuantite > 0
      ? lots.reduce((sum, lot) => {
          const selected = selectedMap.get(lot.id);
          return sum + lot.quantite * (selected?.newPercent ?? lot.avancementPercent);
        }, 0) / totalQuantite
      : 0;
    const lotsCount = this.selectedLots().filter((item) => item.quantitePeriode != null && item.quantitePeriode > 0).length;

    return {
      lotsCount,
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
      this.selectedLotIds.set([item.lotId]);
      this.draftByLotId.set({
        [item.lotId]: {
          lotId: item.lotId,
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
      this.selectedLotIds.set([]);
      this.draftByLotId.set({});
      this.dernierByLotId.set({});
      return;
    }

    void this.loadLotsAndDefaults(chantierId);
  }

  private async loadLotsAndDefaults(chantierId: string): Promise<void> {
    await this.loadDernierAvancements(chantierId);
    await this.context.loadLotsForChantier(chantierId, this.dernierByLotId());
    const defaultLots = this.context.getActiveLotsForChantier(chantierId).slice(0, 4);
    this.selectedLotIds.set(defaultLots.map((lot) => lot.id));
    this.draftByLotId.set(
      defaultLots.reduce<Record<string, LotSaisieDraft>>((accumulator, lot) => {
        accumulator[lot.id] = {
          lotId: lot.id,
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

  addLot(lotId: string): void {
    if (this.selectedLotIds().includes(lotId)) {
      return;
    }

    this.selectedLotIds.update((ids) => [...ids, lotId]);
    this.draftByLotId.update((drafts) => ({
      ...drafts,
      [lotId]: drafts[lotId] ?? {
        lotId,
        quantitePeriode: null,
        notes: '',
        photos: [],
      },
    }));
  }

  removeLot(lotId: string): void {
    this.selectedLotIds.update((ids) => ids.filter((id) => id !== lotId));
    this.draftByLotId.update((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[lotId];
      return nextDrafts;
    });
  }

  setLotQuantity(lotId: string, value: number | null): void {
    this.patchDraft(lotId, { quantitePeriode: value != null && !Number.isNaN(value) ? value : null });
  }

  setLotNotes(lotId: string, notes: string): void {
    this.patchDraft(lotId, { notes });
  }

  setLotPhotos(lotId: string, photos: LotSaisieDraft['photos']): void {
    this.patchDraft(lotId, { photos });
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

    const entries = this.selectedLots()
      .filter((item) => item.quantitePeriode != null && item.quantitePeriode > 0)
      .map((item) => ({
        lotId: item.lot.id,
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

  private patchDraft(lotId: string, patch: Partial<LotSaisieDraft>): void {
    this.draftByLotId.update((drafts) => ({
      ...drafts,
      [lotId]: {
        ...drafts[lotId],
        lotId,
        quantitePeriode: drafts[lotId]?.quantitePeriode ?? null,
        notes: drafts[lotId]?.notes ?? '',
        photos: drafts[lotId]?.photos ?? [],
        ...patch,
      },
    }));
  }

  private async loadDernierAvancements(chantierId: string): Promise<void> {
    try {
      const items = await this.api.getDernierByChantier(chantierId);
      this.dernierByLotId.set(
        items.reduce<Record<string, AvancementListItem>>((accumulator, item) => {
          if (item.lotId) {
            accumulator[item.lotId] = item;
          }
          return accumulator;
        }, {}),
      );
    } catch {
      this.dernierByLotId.set({});
    }
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}