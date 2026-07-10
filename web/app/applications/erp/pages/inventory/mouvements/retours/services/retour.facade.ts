import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { CrudStyleFacade } from '@lib/anatomy';
import type { ListResponse, LookupContext } from '@lib/anatomy/types';
import type { InventoryTx, InventoryTxLine, Location, MotifMouvement } from '../../../../../inventory/models';
import { ArticleCatalogService } from '../../../../../inventory/services/article-catalog.service';
import { InventoryLookupsService } from '../../../../../inventory/services/inventory-lookups.service';
import { InventoryMovementApiService } from '../../../../../inventory/services/inventory-movement-api.service';
import { loadMovementPage } from '../../../../../inventory/services/movement-facade.util';
import type { ApiInventoryTxRow } from '../../../../../inventory/services/inventory-tx.mapper';
import { MotifsApiService } from '../../../../../inventory/services/motifs-api.service';

export type RetourType = 'RETOUR_CHANTIER' | 'RETOUR_FOURNISSEUR';

export interface RetourListItem extends InventoryTx {
  retourType?: RetourType;
}

export interface RetourTxLine extends InventoryTxLine {
  etatArticle?: 'BON' | 'ABIME' | 'INUTILISABLE';
}

@Injectable({ providedIn: 'root' })
export class RetourFacade implements CrudStyleFacade<InventoryTx, Partial<InventoryTx>> {
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
      this.motifsApi.listByTxType('RETOUR'),
    ]);
    this.locationsCache = locations;
    this.motifsCache = motifs;
    const chantiers = locations.filter((l) => l.type === 'CHANTIER');
    const depots = locations.filter((l) => l.type === 'DEPOT' || l.type === 'ENTREPOT');
    const matCons = articles.filter(
      (a) => a.articleType === 'MATERIAU' || a.articleType === 'CONSOMMABLE',
    );
    this.lookupsSignal.set({
      chantierLocations: chantiers.map((l) => ({
        key: l.id,
        value: l.projectRef ? `${l.name} (${l.projectRef})` : l.name,
      })),
      depotLocations: depots.map((l) => ({ key: l.id, value: l.name })),
      articlesMatCons: matCons.map((a) => ({
        key: a.id,
        value: `${a.code} — ${a.name}`,
        data: { uomCode: a.uomCode, uomId: a.uomId },
      })),
      motifsRetour: motifs.map((m) => ({ key: m.id, value: `${m.code} — ${m.name}` })),
      retourTypes: [
        { key: 'RETOUR_CHANTIER', value: 'Retour chantier' },
        { key: 'RETOUR_FOURNISSEUR', value: 'Retour fournisseur' },
      ],
      etatArticleOptions: [
        { key: 'BON', value: 'Bon état' },
        { key: 'ABIME', value: 'Abîmé' },
        { key: 'INUTILISABLE', value: 'Inutilisable' },
      ],
    });
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<RetourListItem>> {
    await this.ensureLookups();
    return loadMovementPage(
      this.movementApi,
      'RETOUR',
      query,
      (rows) => this.applyFilters(rows, query),
      (tx) => ({ ...tx, retourType: this.inferRetourType(tx) }),
      this.enrichers(),
    );
  }

  private inferRetourType(tx: InventoryTx): RetourType {
    if (!tx.destLocationId) {
      return 'RETOUR_FOURNISSEUR';
    }
    const dest = this.locationsCache.find((l) => l.id === tx.destLocationId);
    if (dest?.type === 'DEPOT' || dest?.type === 'ENTREPOT') {
      return 'RETOUR_CHANTIER';
    }
    return 'RETOUR_FOURNISSEUR';
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
    return this.movementApi.create(
      {
        ...input,
        txType: 'RETOUR',
        txDate: input.txDate ?? new Date().toISOString().slice(0, 10),
        status: 'BROUILLON',
        lines: input.lines ?? [],
      },
      this.enrichers(),
    );
  }

  async updateItem(id: string, input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const current = await this.movementApi.getDetail(id, this.enrichers());
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.retour.cannotModifyValidated'));
    }
    return this.movementApi.update(
      id,
      { ...current, ...input, lines: input.lines ?? current.lines },
      this.enrichers(),
    );
  }

  async deleteItem(id: string): Promise<void> {
    const current = await this.movementApi.getDetail(id);
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.retour.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }

  async validate(id: string): Promise<InventoryTx> {
    return this.movementApi.validate(id, this.enrichers());
  }

  async reject(id: string): Promise<InventoryTx> {
    const current = await this.movementApi.getDetail(id);
    if (current.txType !== 'RETOUR' || current.status !== 'BROUILLON') {
      throw new Error(this.translate.instant('inventory.errors.common.rejectFailed'));
    }
    return this.movementApi.cancel(id, this.enrichers());
  }

  async cancelValidated(id: string): Promise<void> {
    throw new Error(this.translate.instant('inventory.errors.common.cancelFailed'));
  }

  private locationName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.locationsCache.find((l) => l.id === id)?.name;
  }

  private motifName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.motifsCache.find((m) => m.id === id)?.name;
  }
}
