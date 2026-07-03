import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { CrudStyleFacade } from '@lib/anatomy';
import type { ListResponse, LookupContext } from '@lib/anatomy/types';
import type { InventoryTx, InventoryTxLine, Location, MotifMouvement } from '../../../../../inventory/models';
import { ArticleCatalogService } from '../../../../../inventory/services/article-catalog.service';
import { InventoryLookupsService } from '../../../../../inventory/services/inventory-lookups.service';
import { InventoryMovementApiService } from '../../../../../inventory/services/inventory-movement-api.service';
import {
  loadMovementPage,
  sumLineTotals,
} from '../../../../../inventory/services/movement-facade.util';
import type { ApiInventoryTxRow } from '../../../../../inventory/services/inventory-tx.mapper';
import { MotifsApiService } from '../../../../../inventory/services/motifs-api.service';

export type CauseDetaillee = 'DECOUPE' | 'CASSE' | 'DETERIORATION' | 'AUTRE';

export interface PerteLine extends InventoryTxLine {
  causeDetaillee?: CauseDetaillee;
}

export interface PerteListItem extends InventoryTx {
  totalValue: number;
}

@Injectable({ providedIn: 'root' })
export class PerteFacade implements CrudStyleFacade<InventoryTx, Partial<InventoryTx>> {
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
      this.motifsApi.listByTxType('PERTE'),
    ]);
    this.locationsCache = locations;
    this.motifsCache = motifs;
    const chantiers = locations.filter((l) => l.type === 'CHANTIER');
    const matCons = articles.filter(
      (a) => a.articleType === 'MATERIAU' || a.articleType === 'CONSOMMABLE',
    );
    this.lookupsSignal.set({
      chantierLocations: chantiers.map((l) => ({
        key: l.id,
        value: l.projectRef ? `${l.name} (${l.projectRef})` : l.name,
      })),
      articlesMatCons: matCons.map((a) => ({
        key: a.id,
        value: `${a.code} — ${a.name}`,
        data: { uomCode: a.uomCode, uomId: a.uomId, prix: a.prixUnitaire },
      })),
      motifsPerte: motifs.map((m) => ({ key: m.id, value: `${m.code} — ${m.name}` })),
      causeDetaillee: [
        { key: 'DECOUPE', value: 'Chute découpe' },
        { key: 'CASSE', value: 'Casse' },
        { key: 'DETERIORATION', value: 'Détérioration' },
        { key: 'AUTRE', value: 'Autre' },
      ],
    });
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<PerteListItem>> {
    await this.ensureLookups();
    return loadMovementPage(
      this.movementApi,
      'PERTE',
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

    const motifId = query['motifId'] as string | undefined;
    if (motifId) {
      out = out.filter((r) => r.motifId === motifId);
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
        txType: 'PERTE',
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
      throw new Error(this.translate.instant('inventory.errors.perte.cannotModifyValidated'));
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
      throw new Error(this.translate.instant('inventory.errors.perte.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }

  async validate(id: string): Promise<InventoryTx> {
    return this.movementApi.validate(id, this.enrichers());
  }

  async getKpis(): Promise<{ totalMonth: number; totalChantier: number }> {
    await this.ensureLookups();
    const headers = await this.movementApi.listHeadersByType('PERTE', { pageSize: 500 });
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalMonth = 0;
    let totalChantier = 0;
    for (const row of headers) {
      const tx = await this.movementApi.getDetail(row.id, this.enrichers());
      const val = sumLineTotals(tx.lines);
      if (tx.txDate.startsWith(monthStr)) {
        totalMonth += val;
      }
      totalChantier += val;
    }

    return { totalMonth, totalChantier };
  }

  private applyChantierMeta(tx: Partial<InventoryTx>): Partial<InventoryTx> {
    const cid = tx.chantierLocationId;
    if (!cid) {
      return tx;
    }
    const loc = this.locationsCache.find((l) => l.id === cid);
    const chantierRef = loc
      ? loc.projectRef
        ? `${loc.name} (${loc.projectRef})`
        : loc.name
      : tx.chantierRef;
    return { ...tx, chantierRef };
  }

  private locationName(id?: string): string | undefined {
    if (!id) return undefined;
    const loc = this.locationsCache.find((l) => l.id === id);
    if (!loc) return undefined;
    return loc.projectRef ? `${loc.name} (${loc.projectRef})` : loc.name;
  }

  private motifName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.motifsCache.find((m) => m.id === id)?.name;
  }
}
