import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { CrudStyleFacade } from '@lib/anatomy';
import type { ListResponse, LookupContext } from '@lib/anatomy/types';
import type {
  Article,
  InventoryTx,
  Location,
  MotifMouvement,
} from '../../../../../inventory/models';
import { ArticleCatalogService } from '../../../../../inventory/services/article-catalog.service';
import { InventoryLookupsService } from '../../../../../inventory/services/inventory-lookups.service';
import { InventoryMovementApiService } from '../../../../../inventory/services/inventory-movement-api.service';
import {
  loadMovementPage,
  sumLineTotals,
} from '../../../../../inventory/services/movement-facade.util';
import type { ApiInventoryTxRow } from '../../../../../inventory/services/inventory-tx.mapper';
import { MotifsApiService } from '../../../../../inventory/services/motifs-api.service';

export interface TransfertListItem extends InventoryTx {
  totalValue: number;
}

@Injectable({ providedIn: 'root' })
export class TransfertFacade implements CrudStyleFacade<InventoryTx, Partial<InventoryTx>> {
  private readonly movementApi = inject(InventoryMovementApiService);
  private readonly lookupsService = inject(InventoryLookupsService);
  private readonly articleCatalog = inject(ArticleCatalogService);
  private readonly motifsApi = inject(MotifsApiService);

  private locationsCache: Location[] = [];
  private motifsCache: MotifMouvement[] = [];

  private lookupsSignal = signal<LookupContext>({});
  private readonly translate = inject(TranslateService);

  readonly lookups = computed(() => this.lookupsSignal());

  private enrichers() {
    return {
      locationName: (id?: string) => this.locationName(id),
      motifName: (id?: string) => this.motifName(id),
    };
  }

  async ensureLookups(): Promise<void> {
    const [locations, articles, motifs] = await Promise.all([
      this.lookupsService.loadLocations(),
      this.articleCatalog.loadArticles({ activeOnly: true }),
      this.motifsApi.listByTxType('TRANSFERT'),
    ]);
    this.locationsCache = locations;
    this.motifsCache = motifs;

    const allLocations = locations.filter((l) => l.isActive);
    const chantierLocations = allLocations.filter((l) => l.type === 'CHANTIER');
    const matCons = articles.filter(
      (a) => a.articleType === 'MATERIAU' || a.articleType === 'CONSOMMABLE',
    );

    this.lookupsSignal.set({
      allLocations: allLocations.map((l) => ({
        key: l.id,
        value: l.projectRef ? `${l.name} (${l.projectRef})` : l.name,
        data: { type: l.type },
      })),
      chantierLocations: chantierLocations.map((l) => ({
        key: l.id,
        value: l.projectRef ? `${l.name} (${l.projectRef})` : l.name,
      })),
      motifsTransfertChantier: motifs.map((m) => ({
        key: m.id,
        value: `${m.code} — ${m.name}`,
      })),
      articlesMatCons: matCons.map((a) => ({
        key: a.id,
        value: `${a.code} — ${a.name}`,
        data: { uomCode: a.uomCode, uomId: a.uomId, prix: a.prixUnitaire },
      })),
    });
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<TransfertListItem>> {
    await this.ensureLookups();
    return loadMovementPage(
      this.movementApi,
      'TRANSFERT',
      query,
      (rows) => this.applyFilters(rows, query),
      (tx) => ({ ...tx, totalValue: sumLineTotals(tx.lines) }),
      this.enrichers(),
    );
  }

  private applyFilters(rows: ApiInventoryTxRow[], query?: Record<string, unknown>): ApiInventoryTxRow[] {
    if (!query) return rows;
    let out = [...rows];

    const status = query['status'] as string | undefined;
    if (status) {
      out = out.filter((r) => r.status === status);
    }

    const sourceLocationId = query['sourceLocationId'] as string | undefined;
    if (sourceLocationId) {
      out = out.filter((r) => r.sourceLocationId === sourceLocationId);
    }

    const destLocationId = query['destLocationId'] as string | undefined;
    if (destLocationId) {
      out = out.filter((r) => r.destLocationId === destLocationId);
    }

    const dateFrom = query['dateFrom'] as string | undefined;
    const dateTo = query['dateTo'] as string | undefined;
    if (dateFrom) {
      out = out.filter((r) => r.txDate >= dateFrom);
    }
    if (dateTo) {
      out = out.filter((r) => r.txDate <= dateTo);
    }

    const search = query['search'] as string | undefined;
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.txNumber.toLowerCase().includes(q) ||
          (r.reference ?? '').toLowerCase().includes(q),
      );
    }

    return out;
  }

  async getItem(id: string): Promise<InventoryTx> {
    await this.ensureLookups();
    return this.movementApi.getDetail(id, this.enrichers());
  }

  async createItem(input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const merged = this.applyChantierMeta(input);
    return this.movementApi.create(
      {
        ...merged,
        txType: 'TRANSFERT',
        txDate: merged.txDate ?? new Date().toISOString().slice(0, 10),
        status: 'BROUILLON',
        lines: merged.lines ?? [],
      },
      this.enrichers(),
    );
  }

  async updateItem(id: string, input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const current = await this.movementApi.getDetail(id, this.enrichers());
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.transfert.cannotModifyValidated'));
    }
    const merged = this.applyChantierMeta({ ...current, ...input });
    return this.movementApi.update(
      id,
      { ...merged, lines: input.lines ?? current.lines },
      this.enrichers(),
    );
  }

  async deleteItem(id: string): Promise<void> {
    const current = await this.movementApi.getDetail(id);
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.transfert.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }

  async validate(id: string): Promise<InventoryTx> {
    await this.ensureLookups();
    return this.movementApi.validate(id, this.enrichers());
  }

  async cancelDraft(id: string): Promise<InventoryTx> {
    const current = await this.movementApi.getDetail(id);
    if (current.txType !== 'TRANSFERT' || current.status !== 'BROUILLON') {
      throw new Error(this.translate.instant('inventory.errors.common.cancelFailed'));
    }
    return this.movementApi.cancel(id, this.enrichers());
  }

  async cancelValidated(id: string): Promise<InventoryTx> {
    throw new Error(this.translate.instant('inventory.errors.common.cancelFailed'));
  }

  private locationName(id?: string): string | undefined {
    if (!id) return undefined;
    const loc = this.locationsCache.find((l) => l.id === id);
    if (!loc) return undefined;
    return loc.projectRef ? `${loc.name} (${loc.projectRef})` : loc.name;
  }

  private applyChantierMeta(tx: Partial<InventoryTx>): Partial<InventoryTx> {
    const chantierLocationId = tx.chantierLocationId;
    const chantier = chantierLocationId
      ? this.locationsCache.find((l) => l.id === chantierLocationId && l.type === 'CHANTIER')
      : undefined;

    const destLocationId = chantier ? chantier.id : tx.destLocationId;
    const chantierRef = chantier
      ? (chantier.projectRef ? `${chantier.name} (${chantier.projectRef})` : chantier.name)
      : tx.chantierRef;

    return {
      ...tx,
      destLocationId,
      chantierRef,
    };
  }

  private motifName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.motifsCache.find((m) => m.id === id)?.name;
  }

}
