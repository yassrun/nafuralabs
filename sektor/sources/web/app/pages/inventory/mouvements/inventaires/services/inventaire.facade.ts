import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import type { CrudStyleFacade } from '@lib/anatomy';
import type { ListResponse, LookupContext } from '@lib/anatomy/types';
import type { InventaireLine, InventaireTx, Location, StockBalance } from '../../../../../inventory/models';
import { InventoryLookupsService } from '../../../../../inventory/services/inventory-lookups.service';
import { InventoryMovementApiService } from '../../../../../inventory/services/inventory-movement-api.service';
import { StockQueryService } from '../../../../../inventory/services/stock-query.service';
import type { ApiInventoryTxRow } from '../../../../../inventory/services/inventory-tx.mapper';

export interface InventaireListItem extends InventaireTx {
  linesCount: number;
}

@Injectable({ providedIn: 'root' })
export class InventaireFacade implements CrudStyleFacade<InventaireTx, Partial<InventaireTx>> {
  private readonly movementApi = inject(InventoryMovementApiService);
  private readonly lookupsService = inject(InventoryLookupsService);
  private readonly stockQuery = inject(StockQueryService);

  private locationsCache: Location[] = [];

  private lookupsSignal = signal<LookupContext>({});
  private readonly translate = inject(TranslateService);

  readonly lookups = computed(() => this.lookupsSignal());

  private enrichers() {
    return {
      locationName: (id?: string) => this.locationName(id),
    };
  }

  async ensureLookups(): Promise<void> {
    this.locationsCache = await this.lookupsService.loadLocations();
    this.lookupsSignal.set({
      allLocations: this.locationsCache.map((l) => ({
        key: l.id,
        value: l.type === 'CHANTIER' && l.projectRef ? `${l.name} (${l.projectRef})` : l.name,
        data: { type: l.type },
      })),
    });
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<InventaireListItem>> {
    await this.ensureLookups();
    let rows = await this.movementApi.listHeadersByType('INVENTAIRE', { pageSize: 500 });
    rows = this.applyFilters(rows, query);

    const page = Number(query?.['page'] ?? 1);
    const pageSize = Number(query?.['pageSize'] ?? 20);
    const total = rows.length;
    const slice = rows.slice((page - 1) * pageSize, page * pageSize);

    const items: InventaireListItem[] = await Promise.all(
      slice.map(async (row) => {
        const inv = await this.movementApi.getInventaireDetail(row.id, this.enrichers());
        return {
          ...inv,
          linesCount: inv.lines.length,
        };
      }),
    );

    return { items, total };
  }

  private applyFilters(rows: ApiInventoryTxRow[], query?: Record<string, unknown>): ApiInventoryTxRow[] {
    if (!query) return rows;
    let out = [...rows];

    const status = query['status'] as string | undefined;
    if (status) {
      out = out.filter((r) => r.status === status);
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

  async getItem(id: string): Promise<InventaireTx> {
    await this.ensureLookups();
    return this.movementApi.getInventaireDetail(id, this.enrichers());
  }

  async createItem(input: Partial<InventaireTx>): Promise<InventaireTx> {
    await this.ensureLookups();
    const lines = this.normalizeLines(input.lines ?? []);
    return this.movementApi.createInventaire(
      {
        ...input,
        txType: 'INVENTAIRE',
        txDate: input.txDate ?? new Date().toISOString().slice(0, 10),
        destLocationId: input.destLocationId,
        status: 'BROUILLON',
        lines,
        totalVariance: lines.reduce((acc, l) => acc + l.variance, 0),
      },
      this.enrichers(),
    );
  }

  async updateItem(id: string, input: Partial<InventaireTx>): Promise<InventaireTx> {
    await this.ensureLookups();
    const current = await this.movementApi.getInventaireDetail(id, this.enrichers());
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.inventaire.cannotModifyValidated'));
    }
    const lines = this.normalizeLines(input.lines ?? current.lines);
    return this.movementApi.updateInventaire(
      id,
      {
        ...current,
        ...input,
        destLocationId: input.destLocationId ?? current.destLocationId,
        lines,
        totalVariance: lines.reduce((acc, l) => acc + l.variance, 0),
      },
      this.enrichers(),
    );
  }

  async deleteItem(id: string): Promise<void> {
    const current = await this.movementApi.getInventaireDetail(id);
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.inventaire.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }

  async validate(id: string): Promise<InventaireTx> {
    return this.movementApi.validateInventaire(id, this.enrichers());
  }

  async getStockBalancesForLocation(locationId: string): Promise<StockBalance[]> {
    return this.stockQuery.getBalancesByLocation(locationId);
  }

  private locationName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.locationsCache.find((l) => l.id === id)?.name;
  }

  private normalizeLines(lines: InventaireLine[]): InventaireLine[] {
    return lines.map((l, i) => ({
      ...l,
      lineNumber: i + 1,
      variance: l.countedQty - l.theoreticalQty,
      quantity: l.countedQty,
    }));
  }
}
